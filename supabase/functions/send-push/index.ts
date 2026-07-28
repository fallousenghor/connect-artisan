// Supabase Edge Function : "send-push"
// Déclenchée par un Database Webhook sur INSERT dans la table "messages".
// Envoie une notification push (Web Push) au destinataire du message.
//
// Déploiement :
//   supabase functions deploy send-push
//   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:contact@votredomaine.com
//
// Configuration du déclencheur (dans le Dashboard Supabase) :
//   Database → Webhooks → Create a new hook
//     Table: messages | Events: Insert | Type: Supabase Edge Functions
//     Edge Function: send-push
//
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont injectées automatiquement
// par Supabase dans toutes les Edge Functions, pas besoin de les configurer.

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:contact@example.com'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

Deno.serve(async (req) => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response(JSON.stringify({ error: 'Clés VAPID non configurées.' }), { status: 500 })
  }

  try {
    const payload = await req.json()
    const message = payload.record

    if (!message?.conversation_id || !message?.sender_id) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 })
    }

    const { data: conversation } = await supabase
      .from('conversations')
      .select('client_id, artisan_id')
      .eq('id', message.conversation_id)
      .maybeSingle()

    if (!conversation) return new Response(JSON.stringify({ skipped: true }), { status: 200 })

    const recipientId =
      conversation.client_id === message.sender_id ? conversation.artisan_id : conversation.client_id

    const [{ data: sender }, { data: subscriptions }] = await Promise.all([
      supabase.from('profiles').select('nom_complet').eq('id', message.sender_id).maybeSingle(),
      supabase.from('push_subscriptions').select('*').eq('user_id', recipientId),
    ])

    if (!subscriptions?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 })

    const notifPayload = JSON.stringify({
      title: sender?.nom_complet || 'Nouveau message',
      body: String(message.content || '').slice(0, 120),
      url: `/messages/${message.conversation_id}`,
    })

    let sent = 0
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notifPayload
        )
        sent++
      } catch (err) {
        // Abonnement expiré ou invalide : on le supprime pour ne plus réessayer
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
