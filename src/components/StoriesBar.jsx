import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import MetierIcon from './MetierIcon'
import { isPremium } from '../lib/premium'

export default function StoriesBar() {
  const [artisans, setArtisans] = useState([])

  useEffect(() => {
    supabase
      .from('artisans_profiles')
      .select('id, disponible, verifie, premium_until, profiles(nom_complet, avatar_url), metiers(icone)')
      .eq('disponible', true)
      .order('note_moyenne', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        const tries = [...(data || [])].sort((a, b) => Number(isPremium(b)) - Number(isPremium(a)))
        setArtisans(tries.slice(0, 12))
      })
  }, [])

  if (artisans.length === 0) return null

  return (
    <div className="bg-card border border-border rounded-lg mb-3 p-3 shadow-sm">
      <p className="text-xs font-semibold text-ink2 uppercase tracking-wide mb-2.5 px-0.5">
        Artisans disponibles maintenant
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-0.5 px-0.5" style={{ scrollbarWidth: 'none' }}>
        {artisans.map((a) => (
          <Link key={a.id} to={`/artisan/${a.id}`} className="flex flex-col items-center gap-1 shrink-0 w-16">
            <div
              className={`w-14 h-14 rounded-full p-[2px] ${
                isPremium(a) ? 'bg-marigold' : 'bg-gradient-to-tr from-fb to-green'
              }`}
            >
              <div className="w-full h-full rounded-full border-2 border-card overflow-hidden bg-fb flex items-center justify-center">
                {a.profiles?.avatar_url ? (
                  <img src={a.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <MetierIcon icone={a.metiers?.icone} size={20} className="text-white" />
                )}
              </div>
            </div>
            <span className="text-[10px] text-ink text-center truncate w-full">
              {a.profiles?.nom_complet?.split(' ')[0]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
