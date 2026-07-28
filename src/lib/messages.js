import { supabase } from './supabase'

/**
 * Récupère la conversation entre un client et un artisan, ou la crée
 * si elle n'existe pas encore.
 */
export async function getOrCreateConversation(clientId, artisanId) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('client_id', clientId)
    .eq('artisan_id', artisanId)
    .maybeSingle()

  if (existing) return existing.id

  const { data, error } = await supabase
    .from('conversations')
    .insert({ client_id: clientId, artisan_id: artisanId })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

/** Marque comme lus tous les messages reçus (pas envoyés par moi) dans une conversation. */
export async function markConversationRead(conversationId, myUserId) {
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .is('read_at', null)
    .neq('sender_id', myUserId)
}

/** Compte le nombre total de messages non lus pour l'utilisateur, tous fils confondus. */
export async function countUnreadMessages(userId) {
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .or(`client_id.eq.${userId},artisan_id.eq.${userId}`)

  const ids = (convs || []).map((c) => c.id)
  if (ids.length === 0) return 0

  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('conversation_id', ids)
    .is('read_at', null)
    .neq('sender_id', userId)

  return count || 0
}
