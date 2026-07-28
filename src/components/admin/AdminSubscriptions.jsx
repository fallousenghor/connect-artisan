import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Loader from '../Loader'
import { formatDate } from '../../lib/utils'

const STATUT_LABEL = {
  actif: { label: 'Actif', className: 'bg-green/10 text-green' },
  en_attente: { label: 'En attente', className: 'bg-marigold/15 text-marigold' },
  echoue: { label: 'Échoué', className: 'bg-red/10 text-red' },
}

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('subscriptions')
      .select('*, artisans_profiles(profiles(nom_complet))')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setSubs(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <Loader label="Chargement des abonnements…" />

  const revenusActifs = subs.filter((s) => s.status === 'actif').reduce((sum, s) => sum + s.amount, 0)
  const nbActifs = subs.filter((s) => s.status === 'actif').length

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <TrendingUp size={18} className="text-green" />
          <p className="text-2xl font-bold text-ink mt-2">{revenusActifs.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-ink2">FCFA de revenus (abonnements actifs)</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <Crown size={18} className="text-marigold" />
          <p className="text-2xl font-bold text-ink mt-2">{nbActifs}</p>
          <p className="text-xs text-ink2">Artisans premium actifs</p>
        </div>
      </div>

      {subs.length === 0 ? (
        <p className="text-sm text-ink2 text-center py-8">Aucun abonnement pour le moment.</p>
      ) : (
        <div className="space-y-2">
          {subs.map((s) => {
            const statut = STATUT_LABEL[s.status] || STATUT_LABEL.en_attente
            return (
              <div key={s.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 shadow-sm">
                <div className="min-w-0 flex-1">
                  <Link to={`/artisan/${s.artisan_id}`} className="text-sm font-semibold text-ink truncate block">
                    {s.artisans_profiles?.profiles?.nom_complet || 'Artisan'}
                  </Link>
                  <p className="text-xs text-ink2">
                    {s.plan === 'annuel' ? 'Annuel' : 'Mensuel'} · {s.amount.toLocaleString('fr-FR')} {s.currency} ·{' '}
                    {formatDate(s.created_at)}
                  </p>
                </div>
                <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${statut.className}`}>
                  {statut.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
