import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import MetierIcon from './MetierIcon'
import RatingStars from './RatingStars'
import PremiumBadge from './PremiumBadge'
import { isPremium } from '../lib/premium'

export default function SuggestedArtisans() {
  const [artisans, setArtisans] = useState([])

  useEffect(() => {
    supabase
      .from('artisans_profiles')
      .select('id, note_moyenne, nombre_avis, verifie, ville, premium_until, profiles(nom_complet, avatar_url), metiers(nom, icone)')
      .gt('nombre_avis', 0)
      .order('note_moyenne', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        const tries = [...(data || [])].sort((a, b) => Number(isPremium(b)) - Number(isPremium(a)))
        setArtisans(tries.slice(0, 8))
      })
  }, [])

  if (artisans.length === 0) return null

  return (
    <div className="bg-card border border-border rounded-lg mb-3 p-3 shadow-sm">
      <p className="text-sm font-semibold text-ink mb-2.5 px-0.5">Artisans suggérés pour vous</p>
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-0.5 px-0.5" style={{ scrollbarWidth: 'none' }}>
        {artisans.map((a) => {
          const p = a.profiles
          const metier = a.metiers
          const premium = isPremium(a)
          return (
            <Link
              key={a.id}
              to={`/artisan/${a.id}`}
              className={`shrink-0 w-32 rounded-md border overflow-hidden hover:shadow-sm transition ${
                premium ? 'border-marigold/60' : 'border-border'
              }`}
            >
              <div className="h-16 bg-gradient-to-br from-fb to-fb-dark flex items-end justify-center pb-0">
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
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
