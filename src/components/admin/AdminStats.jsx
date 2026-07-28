import { useEffect, useState } from 'react'
import { Users, Wrench, Image, Star, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Loader from '../Loader'

export default function AdminStats() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function load() {
      const [clients, artisans, verifies, posts, reviews] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'artisan'),
        supabase.from('artisans_profiles').select('*', { count: 'exact', head: true }).eq('verifie', true),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        clients: clients.count ?? 0,
        artisans: artisans.count ?? 0,
        verifies: verifies.count ?? 0,
        posts: posts.count ?? 0,
        reviews: reviews.count ?? 0,
      })
    }
    load()
  }, [])

  if (!stats) return <Loader label="Chargement des statistiques…" />

  const cards = [
    { label: 'Clients', value: stats.clients, icon: Users, color: 'text-fb' },
    { label: 'Artisans', value: stats.artisans, icon: Wrench, color: 'text-fb' },
    { label: 'Artisans vérifiés', value: stats.verifies, icon: ShieldCheck, color: 'text-green' },
    { label: 'Publications', value: stats.posts, icon: Image, color: 'text-fb' },
    { label: 'Avis publiés', value: stats.reviews, icon: Star, color: 'text-marigold' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <Icon size={18} className={color} />
          <p className="text-2xl font-bold text-ink mt-2">{value}</p>
          <p className="text-xs text-ink2">{label}</p>
        </div>
      ))}
    </div>
  )
}
