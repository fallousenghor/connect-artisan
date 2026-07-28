import { NavLink } from 'react-router-dom'
import { Home, Search, PlusSquare, User, MessageCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUnreadMessages } from '../lib/useUnreadMessages'

function Item({ to, end, Icon, label, badge }) {
  return (
    <NavLink to={to} end={end} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative">
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute top-0 inset-x-6 h-0.5 bg-fb rounded-full" />}
          <span className="relative">
            <Icon size={23} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-fb' : 'text-ink2'} />
            {badge > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-red text-white text-[9px] font-bold flex items-center justify-center">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </span>
          <span className={`text-[10px] font-medium ${isActive ? 'text-fb' : 'text-ink2'}`}>{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function BottomNav() {
  const { user, isArtisan } = useAuth()
  const unread = useUnreadMessages(user?.id)

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border safe-bottom shadow-[0_-1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex max-w-lg mx-auto">
        <Item to="/" end Icon={Home} label="Accueil" />
        <Item to="/recherche" Icon={Search} label="Recherche" />
        {user && <Item to="/messages" Icon={MessageCircle} label="Messages" badge={unread} />}
        {isArtisan && <Item to="/publier" Icon={PlusSquare} label="Publier" />}
        <Item to={user ? '/profil' : '/connexion'} Icon={User} label={user ? 'Profil' : 'Connexion'} />
      </div>
    </nav>
  )
}
