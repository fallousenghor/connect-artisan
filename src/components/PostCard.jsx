import { Link } from 'react-router-dom'
import { MapPin, BadgeCheck, ThumbsUp } from 'lucide-react'
import MetierIcon from './MetierIcon'
import ContactButtons from './ContactButtons'
import RatingStars from './RatingStars'
import PremiumBadge from './PremiumBadge'
import { formatDate } from '../lib/utils'
import { isPremium } from '../lib/premium'

export default function PostCard({ post, likesCount = 0, likedByMe = false, onToggleLike }) {
  const artisan = post.artisans_profiles
  const p = artisan?.profiles
  const metier = artisan?.metiers
  const premium = isPremium(artisan)

  return (
    <article className={`bg-card rounded-lg overflow-hidden shadow-sm border ${premium ? 'border-marigold/50' : 'border-border/70'}`}>
      <div className="p-3 flex items-center gap-2.5">
        <Link to={`/artisan/${artisan?.id}`} className={`w-10 h-10 rounded-full bg-fb overflow-hidden flex items-center justify-center shrink-0 ${premium ? 'ring-2 ring-marigold' : ''}`}>
          {p?.avatar_url ? (
            <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-card font-bold text-sm">{p?.nom_complet?.[0]?.toUpperCase() || '?'}</span>
          )}
        </Link>
        <Link to={`/artisan/${artisan?.id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm text-ink truncate">{p?.nom_complet}</span>
            {artisan?.verifie && <BadgeCheck size={14} className="text-fb shrink-0" />}
            {premium && <PremiumBadge size={13} />}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ink2">
            <span>{metier?.nom}</span>
            <span>·</span>
            <span>{formatDate(post.created_at)}</span>
          </div>
        </Link>
      </div>

      {post.description && <p className="px-3 pb-2.5 text-sm text-ink leading-snug">{post.description}</p>}

      <div className="relative aspect-[4/3] bg-bg">
        {post.media_type === 'video' ? (
          <video src={post.media_url} controls className="w-full h-full object-cover" />
        ) : (
          <img src={post.media_url} alt={post.description || ''} className="w-full h-full object-cover" loading="lazy" />
        )}
      </div>

      <div className="px-3 py-2 flex items-center justify-between border-b border-border/70">
        <div className="flex items-center gap-1.5">
          {likesCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-ink2">
              <span className="w-4 h-4 rounded-full bg-fb flex items-center justify-center">
                <ThumbsUp size={9} className="text-white fill-white" />
              </span>
              {likesCount}
            </span>
          )}
        </div>
        {artisan?.ville && (
          <span className="flex items-center gap-1 text-xs text-ink2">
            <MapPin size={11} />
            {artisan.ville}
          </span>
        )}
      </div>

      <div className="px-1 flex items-center border-b border-border/70">
        <button
          onClick={onToggleLike}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-md hover:bg-hover transition ${
            likedByMe ? 'text-fb' : 'text-ink2'
          }`}
        >
          <ThumbsUp size={16} className={likedByMe ? 'fill-fb' : ''} />
          J'aime
        </button>
      </div>

      <div className="p-2 flex items-center gap-2.5">
        <div className="flex items-center gap-1 shrink-0 text-xs text-ink2 pl-1">
          <RatingStars note={artisan?.note_moyenne} size={12} />
          <span>({artisan?.nombre_avis || 0})</span>
        </div>
        <div className="flex-1">
          <ContactButtons telephone={p?.telephone} whatsapp={p?.whatsapp} nom={p?.nom_complet} metier={metier?.nom} />
        </div>
      </div>
    </article>
  )
}
