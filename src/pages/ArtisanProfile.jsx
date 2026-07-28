import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, BadgeCheck, CircleDot, CircleOff, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getOrCreateConversation } from '../lib/messages'
import MetierIcon from '../components/MetierIcon'
import RatingStars from '../components/RatingStars'
import ContactButtons from '../components/ContactButtons'
import PremiumBadge from '../components/PremiumBadge'
import Loader from '../components/Loader'
import { formatDate } from '../lib/utils'
import { isPremium } from '../lib/premium'

export default function ArtisanProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [artisan, setArtisan] = useState(null)
  const [posts, setPosts] = useState([])
  const [reviews, setReviews] = useState([])
  const [similaires, setSimilaires] = useState([])
  const [loading, setLoading] = useState(true)
  const [noteForm, setNoteForm] = useState(5)
  const [commentForm, setCommentForm] = useState('')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [messageLoading, setMessageLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const [{ data: a }, { data: p }, { data: r }] = await Promise.all([
      supabase
        .from('artisans_profiles')
        .select('*, profiles(nom_complet, avatar_url, cover_url, telephone, whatsapp), metiers(nom, icone)')
        .eq('id', id)
        .maybeSingle(),
      supabase.from('posts').select('*').eq('artisan_id', id).order('created_at', { ascending: false }),
      supabase
        .from('reviews')
        .select('*, profiles(nom_complet, avatar_url)')
        .eq('artisan_id', id)
        .order('created_at', { ascending: false }),
    ])
    setArtisan(a)
    setPosts(p || [])
    setReviews(r || [])
    setLoading(false)

    if (a?.metier_id) {
      const { data: sim } = await supabase
        .from('artisans_profiles')
        .select('*, profiles(nom_complet, avatar_url), metiers(nom, icone)')
        .eq('metier_id', a.metier_id)
        .neq('id', id)
        .order('note_moyenne', { ascending: false })
        .limit(6)
      setSimilaires(sim || [])
    } else {
      setSimilaires([])
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const submitReview = async (e) => {
    e.preventDefault()
    setSending(true)
    setFeedback('')
    const { error } = await supabase.from('reviews').upsert(
      {
        artisan_id: id,
        client_id: user.id,
        note: noteForm,
        commentaire: commentForm,
      },
      { onConflict: 'artisan_id,client_id' }
    )
    setSending(false)
    if (error) {
      setFeedback("Impossible d'envoyer votre avis pour le moment.")
    } else {
      setCommentForm('')
      setFeedback('Merci, votre avis a été publié !')
      load()
    }
  }

  const startConversation = async () => {
    if (!user) {
      navigate('/connexion')
      return
    }
    setMessageLoading(true)
    try {
      const convId = await getOrCreateConversation(user.id, id)
      navigate(`/messages/${convId}`)
    } finally {
      setMessageLoading(false)
    }
  }

  if (loading) return <Loader label="Chargement du profil…" />
  if (!artisan) return <p className="text-center py-16 text-ink2">Artisan introuvable.</p>

  const p = artisan.profiles
  const metier = artisan.metiers
  const dejaNote = reviews.find((r) => r.client_id === user?.id)

  return (
    <div className="pb-6">
      <div className="bg-card border-b border-border">
        <div className="w-full h-36 sm:h-44 bg-gradient-to-br from-fb to-fb-dark relative overflow-hidden">
          {p?.cover_url && <img src={p.cover_url} alt="" className="w-full h-full object-cover" />}
        </div>

        <div className="px-5">
          <div className="flex items-end gap-4 -mt-10">
            <div className={`w-24 h-24 rounded-full bg-fb border-4 overflow-hidden flex items-center justify-center shrink-0 ${isPremium(artisan) ? 'border-marigold' : 'border-card'}`}>
              {p?.avatar_url ? (
                <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <MetierIcon icone={metier?.icone} size={36} className="text-white" />
              )}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold text-ink truncate">{p?.nom_complet}</h1>
              {artisan.verifie && <BadgeCheck size={18} className="text-fb shrink-0" />}
              {isPremium(artisan) && <PremiumBadge size={18} />}            </div>
            <p className="text-ink2 font-medium text-sm">{metier?.nom}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <RatingStars note={artisan.note_moyenne} size={14} />
              <span className="text-xs text-ink2">({artisan.nombre_avis} avis)</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-ink2">
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {artisan.quartier ? `${artisan.quartier}, ` : ''}{artisan.ville || 'Localisation non précisée'}
              </span>
              <span className="flex items-center gap-1">
                {artisan.disponible ? <CircleDot size={12} className="text-green" /> : <CircleOff size={12} className="text-red" />}
                {artisan.disponible ? 'Disponible' : 'Indisponible'}
              </span>
            </div>

            {artisan.description && <p className="text-sm text-ink mt-3 leading-relaxed">{artisan.description}</p>}

            <div className="mt-4 pb-4 space-y-2">
              {user?.id !== artisan.id && (
                <button
                  onClick={startConversation}
                  disabled={messageLoading}
                  className="w-full flex items-center justify-center gap-2 border border-fb text-fb font-semibold py-2.5 rounded-md text-sm hover:bg-fb/5 transition disabled:opacity-60"
                >
                  <MessageCircle size={16} />
                  {messageLoading ? 'Ouverture…' : 'Envoyer un message'}
                </button>
              )}
              <ContactButtons telephone={p?.telephone} whatsapp={p?.whatsapp} nom={p?.nom_complet} metier={metier?.nom} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold text-base mb-3">Réalisations</h2>
          {posts.length === 0 ? (
            <p className="text-sm text-ink2">Aucune publication pour le moment.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {posts.map((post) => (
                <div key={post.id} className="aspect-square rounded-md overflow-hidden bg-bg">
                  {post.media_type === 'video' ? (
                    <video src={post.media_url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={post.media_url} alt={post.description || ''} className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {similaires.length > 0 && (
        <div className="px-4 mt-4">
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold text-base mb-3">Artisans similaires</h2>
            <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-0.5 px-0.5" style={{ scrollbarWidth: 'none' }}>
              {similaires.map((s) => (
                <Link
                  key={s.id}
                  to={`/artisan/${s.id}`}
                  className="shrink-0 w-28 text-center rounded-md border border-border p-2.5 hover:shadow-sm transition"
                >
                  <div className="w-11 h-11 rounded-full bg-fb overflow-hidden flex items-center justify-center mx-auto">
                    {s.profiles?.avatar_url ? (
                      <img src={s.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <MetierIcon icone={s.metiers?.icone} size={16} className="text-white" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-ink truncate mt-1.5">{s.profiles?.nom_complet}</p>
                  <div className="flex justify-center mt-0.5">
                    <RatingStars note={s.note_moyenne} size={9} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 mt-4">
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold text-base mb-3">Avis clients ({reviews.length})</h2>

          {user && user.id !== artisan.id && (
            <form onSubmit={submitReview} className="bg-bg rounded-md p-4 mb-4 space-y-3">
              <p className="text-sm font-medium">{dejaNote ? 'Modifier mon avis' : 'Laisser un avis'}</p>
              <RatingStars note={noteForm} interactive size={26} onChange={setNoteForm} />
              <textarea
                value={commentForm}
                onChange={(e) => setCommentForm(e.target.value)}
                placeholder="Votre expérience avec cet artisan…"
                rows={3}
                className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-fb resize-none"
              />
              {feedback && <p className="text-green text-sm">{feedback}</p>}
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-fb text-white font-semibold py-2.5 rounded-md text-sm disabled:opacity-60 hover:bg-fb-dark transition"
              >
                {sending ? 'Envoi…' : "Publier l'avis"}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="flex gap-2.5">
                <div className="w-9 h-9 rounded-full bg-fb overflow-hidden flex items-center justify-center shrink-0">
                  {r.profiles?.avatar_url ? (
                    <img src={r.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xs">{r.profiles?.nom_complet?.[0]?.toUpperCase() || '?'}</span>
                  )}
                </div>
                <div className="flex-1 bg-bg rounded-lg px-3.5 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{r.profiles?.nom_complet}</span>
                    <span className="text-xs text-ink2">{formatDate(r.created_at)}</span>
                  </div>
                  <RatingStars note={r.note} size={12} />
                  {r.commentaire && <p className="text-sm text-ink mt-1.5">{r.commentaire}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
