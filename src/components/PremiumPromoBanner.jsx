import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isPremium } from '../lib/premium'

const DISMISS_KEY = 'artisanconnect_premium_banner_dismissed_at'
const DISMISS_DAYS = 7

export default function PremiumPromoBanner() {
  const { isArtisan, artisanProfile } = useAuth()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const last = Number(localStorage.getItem(DISMISS_KEY) || 0)
    const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24)
    setDismissed(daysSince < DISMISS_DAYS)
  }, [])

  if (!isArtisan || isPremium(artisanProfile) || dismissed) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setDismissed(true)
  }

  return (
    <div className="bg-gradient-to-r from-indigo to-fb rounded-lg p-3.5 mb-3 flex items-center gap-3 text-white">
      <Crown size={20} className="text-marigold fill-marigold shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Passez Premium</p>
        <p className="text-xs text-white/80">Boostez votre visibilité et trouvez plus de clients</p>
      </div>
      <Link
        to="/premium"
        className="shrink-0 bg-white text-indigo text-xs font-semibold px-3 py-2 rounded-md"
      >
        Découvrir
      </Link>
      <button onClick={dismiss} aria-label="Fermer" className="shrink-0 p-1">
        <X size={15} />
      </button>
    </div>
  )
}
