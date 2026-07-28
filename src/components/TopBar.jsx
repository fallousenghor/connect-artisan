import { Link, useNavigate } from 'react-router-dom'
import { Hammer, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function TopBar() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 bg-card safe-top border-b border-border shadow-sm">
      <div className="max-w-lg mx-auto flex items-center gap-2 px-3 h-14">
        <Link to="/" className="flex items-center gap-1.5 shrink-0" aria-label="Accueil">
          <span className="w-9 h-9 rounded-full bg-fb flex items-center justify-center shrink-0">
            <Hammer size={17} className="text-card" />
          </span>
        </Link>

        <button
          onClick={() => navigate('/recherche')}
          className="flex-1 flex items-center gap-2 bg-bg rounded-full px-4 py-2.5 text-left text-ink2 text-sm"
        >
          <Search size={16} />
          Rechercher un artisan…
        </button>

        <Link
          to={user ? '/profil' : '/connexion'}
          className="w-9 h-9 rounded-full bg-fb overflow-hidden flex items-center justify-center shrink-0"
          aria-label="Mon profil"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-card font-bold text-sm">
              {profile?.nom_complet?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
