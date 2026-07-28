import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { markConversationRead } from '../lib/messages'
import Loader from '../components/Loader'

export default function Conversation() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [texte, setTexte] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      const { data: conv, error } = await supabase
        .from('conversations')
        .select(
          `id, client_id, artisan_id,
           client:client_id(nom_complet, avatar_url),
           artisan:artisan_id(profiles(nom_complet, avatar_url))`
        )
        .eq('id', id)
        .maybeSingle()

      if (error || !conv) {
        navigate('/messages', { replace: true })
        return
      }
      if (!active) return
      setConversation(conv)

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })

      if (!active) return
      setMessages(msgs || [])
      setLoading(false)
      markConversationRead(id, user.id)
    }
    load()

    const channel = supabase
      .channel(`messages-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
          if (payload.new.sender_id !== user.id) markConversationRead(id, user.id)
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [id, user, navigate])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const contenu = texte.trim()
    if (!contenu) return
    setSending(true)
    setTexte('')

    const { error } = await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: user.id,
      content: contenu,
    })

    setSending(false)
    if (error) setTexte(contenu) // on remet le texte si l'envoi échoue
  }

  if (loading || !conversation) return <Loader label="Chargement de la conversation…" />

  const isClient = conversation.client_id === user.id
  const autre = isClient ? conversation.artisan?.profiles : conversation.client
  const autreId = isClient ? conversation.artisan_id : conversation.client_id

  return (
    <div className="flex flex-col min-h-[75vh]">
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border bg-card sticky top-14 z-20">
        <button onClick={() => navigate('/messages')} aria-label="Retour" className="p-1.5 -ml-1.5">
          <ArrowLeft size={19} className="text-ink" />
        </button>
        <Link to={`/artisan/${autreId}`} className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-fb overflow-hidden flex items-center justify-center shrink-0">
            {autre?.avatar_url ? (
              <img src={autre.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-xs">{autre?.nom_complet?.[0]?.toUpperCase() || '?'}</span>
            )}
          </div>
          <p className="font-semibold text-sm text-ink truncate">{autre?.nom_complet}</p>
        </Link>
      </div>

      <div className="flex-1 px-3 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-xs text-ink2 py-8">
            Démarrez la conversation avec {autre?.nom_complet?.split(' ')[0] || 'cet artisan'}.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user.id
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                  mine ? 'bg-fb text-white rounded-br-sm' : 'bg-card border border-border text-ink rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-border bg-card sticky bottom-16 safe-bottom">
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Écrire un message…"
          className="flex-1 rounded-full border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-fb"
        />
        <button
          type="submit"
          disabled={sending || !texte.trim()}
          aria-label="Envoyer"
          className="w-10 h-10 rounded-full bg-fb text-white flex items-center justify-center shrink-0 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
