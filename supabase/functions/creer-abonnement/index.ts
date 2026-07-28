// Supabase Edge Function : "creer-abonnement"
// Crée une ligne d'abonnement "en_attente" puis initie un paiement CinetPay
// (Wave, Orange Money, Free Money, carte bancaire) et renvoie l'URL de paiement
// vers laquelle rediriger l'utilisateur.
//
// Déploiement :
//   supabase functions deploy creer-abonnement
//   supabase secrets set CINETPAY_APIKEY=... CINETPAY_SITE_ID=... APP_URL=https://votredomaine.com
//
// Appel depuis le frontend (utilisateur authentifié) :
//   supabase.functions.invoke('creer-abonnement', { body: { plan: 'mensuel' } })

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Grille tarifaire (en FCFA / XOF) — modifiez librement selon votre stratégie
const PLANS = {
  mensuel: { amount: 2000, jours: 30, label: 'Premium mensuel' },
  annuel: { amount: 20000, jours: 365, label: 'Premium annuel' },
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentification requise.' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))

    if (!user) {
      return new Response(JSON.stringify({ error: 'Utilisateur non authentifié.' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const { plan } = await req.json()
    const planConfig = PLANS[plan]
    if (!planConfig) {
      return new Response(JSON.stringify({ error: 'Plan invalide.' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const apikey = Deno.env.get('CINETPAY_APIKEY')
    const siteId = Deno.env.get('CINETPAY_SITE_ID')
    const appUrl = Deno.env.get('APP_URL')
    if (!apikey || !siteId || !appUrl) {
      return new Response(JSON.stringify({ error: 'Paiement non configuré (secrets CinetPay manquants).' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nom_complet, telephone')
      .eq('id', user.id)
      .maybeSingle()

    const transactionId = crypto.randomUUID()

    const { error: insertError } = await supabaseAdmin.from('subscriptions').insert({
      artisan_id: user.id,
      plan,
      amount: planConfig.amount,
      currency: 'XOF',
      transaction_id: transactionId,
      status: 'en_attente',
    })
    if (insertError) throw insertError

    const cinetpayRes = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey,
        site_id: siteId,
        transaction_id: transactionId,
        amount: planConfig.amount,
        currency: 'XOF',
        description: `ArtisanConnect — ${planConfig.label}`,
        customer_name: profile?.nom_complet?.split(' ')[0] || 'Artisan',
        customer_surname: profile?.nom_complet?.split(' ').slice(1).join(' ') || 'ArtisanConnect',
        customer_phone_number: profile?.telephone || '',
        notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/verifier-abonnement`,
        return_url: `${appUrl}/premium/retour?transaction_id=${transactionId}`,
        channels: 'ALL',
        metadata: user.id,
        lang: 'FR',
      }),
    })

    const cinetpayData = await cinetpayRes.json()

    if (cinetpayData.code !== '201') {
      await supabaseAdmin.from('subscriptions').update({ status: 'echoue' }).eq('transaction_id', transactionId)
      return new Response(JSON.stringify({ error: cinetpayData.description || 'Échec de l’initialisation du paiement.' }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ payment_url: cinetpayData.data.payment_url, transaction_id: transactionId }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
