// Supabase Edge Function : "verifier-abonnement"
// Reçoit la notification CinetPay (notify_url) après un paiement, vérifie le
// statut réel via l'API CinetPay (jamais faire confiance au webhook seul —
// recommandation officielle CinetPay contre le risque de falsification), puis
// active l'abonnement premium de l'artisan si le paiement est confirmé.
//
// Déploiement :
//   supabase functions deploy verifier-abonnement
//   (utilise les mêmes secrets CINETPAY_APIKEY / CINETPAY_SITE_ID que "creer-abonnement")
//
// Cette fonction est appelée automatiquement par CinetPay, jamais par le frontend.

import { createClient } from 'npm:@supabase/supabase-js@2'

const PLAN_JOURS = { mensuel: 30, annuel: 365 }

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function extraireTransactionId(req: Request): Promise<string | null> {
  const contentType = req.headers.get('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      const body = await req.json()
      return body.cpm_trans_id || body.transaction_id || null
    }
    // CinetPay envoie généralement en application/x-www-form-urlencoded
    const formData = await req.formData()
    return (formData.get('cpm_trans_id') as string) || (formData.get('transaction_id') as string) || null
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  // On répond toujours 200 rapidement : CinetPay réessaie sinon, et on ne veut
  // pas révéler d'informations sur les erreurs internes à un appelant externe.
  try {
    const transactionId = await extraireTransactionId(req)
    if (!transactionId) return new Response('ok')

    const apikey = Deno.env.get('CINETPAY_APIKEY')
    const siteId = Deno.env.get('CINETPAY_SITE_ID')
    if (!apikey || !siteId) return new Response('ok')

    // Étape obligatoire : vérifier le vrai statut auprès de CinetPay,
    // ne jamais se fier au contenu du webhook lui-même.
    const checkRes = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: transactionId, site_id: siteId, apikey }),
    })
    const checkData = await checkRes.json()

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('transaction_id', transactionId)
      .maybeSingle()

    if (!subscription) return new Response('ok')

    if (checkData.data?.status !== 'ACCEPTED') {
      if (subscription.status === 'en_attente') {
        await supabaseAdmin.from('subscriptions').update({ status: 'echoue' }).eq('id', subscription.id)
      }
      return new Response('ok')
    }

    if (subscription.status === 'actif') return new Response('ok') // déjà traité (webhook rejoué)

    const { data: artisan } = await supabaseAdmin
      .from('artisans_profiles')
      .select('premium_until')
      .eq('id', subscription.artisan_id)
      .maybeSingle()

    const jours = PLAN_JOURS[subscription.plan] || 30
    const base =
      artisan?.premium_until && new Date(artisan.premium_until) > new Date()
        ? new Date(artisan.premium_until) // renouvellement anticipé : on cumule
        : new Date()
    const expiresAt = new Date(base.getTime() + jours * 24 * 60 * 60 * 1000)

    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'actif', started_at: new Date().toISOString(), expires_at: expiresAt.toISOString() })
      .eq('id', subscription.id)

    await supabaseAdmin
      .from('artisans_profiles')
      .update({ premium_until: expiresAt.toISOString() })
      .eq('id', subscription.artisan_id)

    return new Response('ok')
  } catch {
    return new Response('ok')
  }
})
