import { Crown } from 'lucide-react'

export default function PremiumBadge({ size = 13, showLabel = false }) {
  if (showLabel) {
    return (
      <span className="inline-flex items-center gap-1 bg-marigold/15 text-ink font-semibold text-[10px] px-1.5 py-0.5 rounded-full">
        <Crown size={size} className="text-marigold fill-marigold" />
        Premium
      </span>
    )
  }
  return <Crown size={size} className="text-marigold fill-marigold shrink-0" />
}
