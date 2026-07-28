import { Link } from 'react-router-dom'
import { MapPin, BadgeCheck, CircleDot } from 'lucide-react'
import MetierIcon from './MetierIcon'
import RatingStars from './RatingStars'
import ContactButtons from './ContactButtons'
import PremiumBadge from './PremiumBadge'
import { formatDistance } from '../lib/utils'
import { isPremium } from '../lib/premium'

export default function ArtisanCard({ artisan, distance }) {
  const metier = artisan.metiers
  const p = artisan.profiles
  const premium = isPremium(artisan)
  return (
    <Link
      to={`/artisan/${artisan.id}`}
      className={`flex gap-3 bg-white rounded-lg p-3 shadow-sm border hover:shadow-md active:scale-[0.99] transition ${
        premium ? 'border-marigold/50' : 'border-sand-dark/60'
      }`}
    >
      <div className="relative shrink-0">
        <div className={`w-16 h-16 rounded-md bg-indigo/10 flex items-center justify-center overflow-hidden ${premium ? 'ring-2 ring-marigold' : ''}`}>
          {p?.avatar_url ? (
            <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <MetierIcon icone={metier?.icone} className="text-indigo" size={28} />
          )}
        </div>
        {artisan.disponible && (
          <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
            <CircleDot size={14} className="text-teal fill-teal" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <h3 className="font-display font-semibold text-ink truncate">{p?.nom_complet}</h3>
          {artisan.verifie && <BadgeCheck size={16} className="text-teal shrink-0" />}
          {premium && <PremiumBadge size={14} />}
        </div>
        <p className="text-sm text-clay font-medium">{metier?.nom}</p>
        <div className="flex items-center gap-2 mt-1">
          <RatingStars note={artisan.note_moyenne} size={13} />
          <span className="text-xs text-ink/60">({artisan.nombre_avis})</span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-ink/60">
          <MapPin size={12} />
          <span className="truncate">
            {artisan.quartier ? `${artisan.quartier}, ` : ''}
            {artisan.ville}
            {distance !== null && distance !== undefined ? ` · ${formatDistance(distance)}` : ''}
          </span>
        </div>
      </div>

      <div className="flex items-center" onClick={(e) => e.preventDefault()}>
        <ContactButtons telephone={p?.telephone} whatsapp={p?.whatsapp} nom={p?.nom_complet} metier={metier?.nom} compact />
      </div>
    </Link>
  )
}
