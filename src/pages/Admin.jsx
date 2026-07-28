import { useState } from 'react'
import { LayoutDashboard, Wrench, Image, Star, ShieldAlert, Crown } from 'lucide-react'
import AdminStats from '../components/admin/AdminStats'
import AdminArtisans from '../components/admin/AdminArtisans'
import AdminPosts from '../components/admin/AdminPosts'
import AdminReviews from '../components/admin/AdminReviews'
import AdminSubscriptions from '../components/admin/AdminSubscriptions'

const TABS = [
  { key: 'stats', label: 'Aperçu', icon: LayoutDashboard, Component: AdminStats },
  { key: 'artisans', label: 'Artisans', icon: Wrench, Component: AdminArtisans },
  { key: 'posts', label: 'Publications', icon: Image, Component: AdminPosts },
  { key: 'reviews', label: 'Avis', icon: Star, Component: AdminReviews },
  { key: 'revenus', label: 'Revenus', icon: Crown, Component: AdminSubscriptions },
]

export default function Admin() {
  const [tab, setTab] = useState('stats')
  const Active = TABS.find((t) => t.key === tab)?.Component

  return (
    <div className="pb-6">
      <div className="bg-fb px-5 pt-6 pb-5">
        <div className="flex items-center gap-2 text-white">
          <ShieldAlert size={20} />
          <h1 className="text-xl font-bold">Administration</h1>
        </div>
        <p className="text-white/80 text-sm mt-1">Modération et vérification de la plateforme</p>
      </div>

      <div className="px-4 -mt-3">
        <div className="bg-card border border-border rounded-lg p-1 flex shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-md text-[11px] font-semibold transition ${
                tab === t.key ? 'bg-fb text-white' : 'text-ink2'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">{Active && <Active />}</div>
    </div>
  )
}
