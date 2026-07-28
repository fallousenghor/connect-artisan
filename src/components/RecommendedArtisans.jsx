import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Sparkles, LocateFixed } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import MetierIcon from './MetierIcon'
import RatingStars from './RatingStars'
import PremiumBadge from './PremiumBadge'
import { isPremium } from '../lib/premium'
import { getUserAffinity, getReviewedArtisanIds, scoreArtisan, dominantMetierId } from '../lib/recommendations'

export default function RecommendedArtisans() {
  const { user } = useAuth()
  const [artisans, setArtisans] = useState([])
  const [affinity, setAffinity] = useState({})
  const [loading, setLoading] = useState(true)
  const [position, setPosition] = useState(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const [{ data: pool }, aff, reviewedIds] = await Promise.all([
        supabase
          .from('artisans_profiles')
          .select('*, profiles(nom_complet, avatar_url), metiers(nom, icone)')
          .eq('disponible', true)
          .limit(60),
        getUserAffinity(user?.id),
        getReviewedArtisanIds(user?.id),
      ])
      if (!active) return

      const candidats = (pool || []).filter((a) => a.id !== user?.id && !reviewedIds.has(a.id))
      setAffinity(aff)
      setArtisans(candidats)
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [user])

  const useMyPosition = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  if (loading || artisans.length === 0) return null

  const dominant = dominantMetierId(affinity)
  const classes = [...artisans]
    .map((a) => ({ ...a, _score: scoreArtisan(a, affinity, position) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 8)

  const personnalise = Object.keys(affinity).length > 0

  return (
    <div className="bg-card border border-border rounded-lg mb-3 p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
          <Sparkles size={14} className="text-fb" />
          {personnalise ? 'Recommandé pour vous' : 'Artisans populaires'}
        </p>
        {!position && (
          <button onClick={useMyPosition} className="text-[11px] font-semibold text-fb flex items-center gap-1">
            <LocateFixed size={12} />
            Affiner par distance
          </button>
        )}
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-0.5 px-0.5" style={{ scrollbarWidth: 'none' }}>
        {classes.map((a) => {
          const p = a.profiles
          const metier = a.metiers
          const pourquoi = personnalise && a.metier_id === dominant ? `Vous aimez : ${metier?.nom}` : null
          const premium = isPremium(a)
          return (
            <Link
              key={a.id}
              to={`/artisan/${a.id}`}
              className={`shrink-0 w-36 rounded-md border overflow-hidden hover:shadow-sm transition ${
                premium ? 'border-marigold/60' : 'border-border'
              }`}
            >
              <div className="h-16 bg-gradient-to-br from-fb to-fb-dark flex items-end justify-center">
                <div
                  className={`w-12 h-12 rounded-full border-2 bg-fb overflow-hidden flex items-center justify-center -mb-6 relative z-10 ${
                    premium ? 'border-marigold' : 'border-card'
                  }`}
                >
                  {p?.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <MetierIcon icone={metier?.icone} size={18} className="text-white" />
                  )}
                </div>
              </div>
              <div className="pt-7 pb-2.5 px-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-xs font-semibold text-ink truncate">{p?.nom_complet}</p>
                  {a.verifie && <BadgeCheck size={11} className="text-fb shrink-0" />}
                </div>
                <p className="text-[10px] text-ink2 truncate">{metier?.nom}</p>
                <div className="flex justify-center mt-1">
                  <RatingStars note={a.note_moyenne} size={9} />
                </div>
                {premium && (
                  <div className="flex justify-center mt-1">
                    <PremiumBadge showLabel size={9} />
                  </div>
                )}
                {pourquoi && (
                  <p className="text-[9px] text-fb bg-fb/10 rounded-full px-1.5 py-0.5 mt-1.5 truncate">{pourquoi}</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
