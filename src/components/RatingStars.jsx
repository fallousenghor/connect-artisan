import { Star } from 'lucide-react'

export default function RatingStars({ note = 0, size = 16, interactive = false, onChange }) {
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className="flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined} aria-label={`Note : ${note} sur 5`}>
      {stars.map((s) => {
        const filled = s <= Math.round(note)
        return interactive ? (
          <button
            key={s}
            type="button"
            aria-label={`${s} étoile${s > 1 ? 's' : ''}`}
            onClick={() => onChange?.(s)}
            className="p-0.5"
          >
            <Star
              size={size}
              className={filled ? 'fill-marigold text-marigold' : 'text-sand-dark'}
            />
          </button>
        ) : (
          <Star
            key={s}
            size={size}
            className={filled ? 'fill-marigold text-marigold' : 'text-sand-dark'}
          />
        )
      })}
    </div>
  )
}
