import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import { formatDate } from '../lib/utils'

export default function Messages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('conversations')
        .select(
          `id, last_message_at, client_id, artisan_id,
           client:client_id(nom_complet, avatar_url),
           artisan:artisan_id(profiles(nom_complet, avatar_url)),
           messages(content, sender_id, created_at, read_at)`
        )
        .or(`client_id.eq.${user.id},artisan_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      if (!active) return
      setConversations(data || [])
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [user])

  if (loading) return <Loader label="Chargement des messages…" />

  return (
    <div className="px-3 pt-3 pb-4">
      <h1 className="text-xl font-bold text-ink mb-3 px-1">Messages</h1>

      {conversations.length === 0 && (
        <div className="text-center py-16 bg-card border border-border rounded-lg">
          <MessageCircle size={28} className="text-ink2 mx-auto mb-2" />
          <p className="text-sm font-semibold text-ink mb-1">Aucune conversation</p>
          <p className="text-ink2 text-xs">Écrivez à un artisan depuis son profil pour démarrer une discussion.</p>
        </div>
      )}

      <div className="space-y-1.5">
        {conversations.map((c) => {
          const isClient = c.client_id === user.id
          const autre = isClient ? c.artisan?.profiles : c.client
          const msgs = [...(c.messages || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          const dernier = msgs[0]
          const nonLu = msgs.some((m) => !m.read_at && m.sender_id !== user.id)

          return (
            <Link
              key={c.id}
              to={`/messages/${c.id}`}
              className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 shadow-sm hover:bg-hover transition"
            >
              <div className="w-12 h-12 rounded-full bg-fb overflow-hidden flex items-center justify-center shrink-0">
                {autre?.avatar_url ? (
                  <img src={autre.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold">{autre?.nom_complet?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm truncate ${nonLu ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>
                  {autre?.nom_complet || 'Utilisateur'}
                </p>
                <p className={`text-xs truncate ${nonLu ? 'text-ink font-medium' : 'text-ink2'}`}>
                  {dernier ? `${dernier.sender_id === user.id ? 'Vous : ' : ''}${dernier.content}` : 'Nouvelle conversation'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {dernier && <span className="text-[10px] text-ink2">{formatDate(dernier.created_at)}</span>}
                {nonLu && <span className="w-2 h-2 rounded-full bg-fb" />}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
