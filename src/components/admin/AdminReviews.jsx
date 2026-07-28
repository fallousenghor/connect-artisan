import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import RatingStars from '../RatingStars'
import Loader from '../Loader'
import { formatDate } from '../../lib/utils'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    supabase
      .from('reviews')
      .select('*, profiles(nom_complet), artisans_profiles(id, profiles(nom_complet))')
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        setReviews(data || [])
        setLoading(false)
      })
  }, [])

  const supprimer = async (id) => {
    setReviews((prev) => prev.filter((r) => r.id !== id))
    setConfirmId(null)
    await supabase.from('reviews').delete().eq('id', id)
  }

  if (loading) return <Loader label="Chargement des avis…" />
  if (reviews.length === 0) return <p className="text-sm text-ink2 text-center py-8">Aucun avis.</p>

  return (
    <div className="space-y-2.5">
      {reviews.map((r) => (
        <div key={r.id} className="bg-card border border-border rounded-lg p-3.5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">
                {r.profiles?.nom_complet} <span className="text-ink2 font-normal">→</span> {r.artisans_profiles?.profiles?.nom_complet}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <RatingStars note={r.note} size={12} />
                <span className="text-xs text-ink2">{formatDate(r.created_at)}</span>
              </div>
            </div>
            <button
              onClick={() => setConfirmId(r.id)}
              aria-label="Supprimer l'avis"
              className="shrink-0 text-red p-1.5 hover:bg-red/10 rounded-md"
            >
              <Trash2 size={15} />
            </button>
          </div>
          {r.commentaire && <p className="text-sm text-ink mt-2">{r.commentaire}</p>}

          {confirmId === r.id && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => supprimer(r.id)} className="flex-1 bg-red text-white text-xs font-semibold py-2 rounded-md">
                Confirmer la suppression
              </button>
              <button onClick={() => setConfirmId(null)} className="flex-1 bg-bg text-ink2 text-xs font-semibold py-2 rounded-md">
                Annuler
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
