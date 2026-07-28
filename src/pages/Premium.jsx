import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Check, TrendingUp, BadgeCheck, Image as ImageIcon, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PLANS, isPremium } from '../lib/premium'

const AVANTAGES = [
  { icon: TrendingUp, text: 'Mis en avant dans les recommandations et la recherche' },
  { icon: Crown, text: 'Badge Premium doré visible sur votre profil' },
  { icon: ImageIcon, text: 'Priorité dans la barre "Artisans disponibles"' },
  { icon: BadgeCheck, text: 'Passage prioritaire pour la vérification du badge ✓' },
]

export default function Premium() {
  const { artisanProfile } = useAuth()
  const navigate = useNavigate()
  const [plan, setPlan] = useState('mensuel')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const dejaPremium = isPremium(artisanProfile)

  const handleSubscribe = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.functions.invoke('creer-abonnement', { body: { plan } })
      if (error || !data || data.error) throw new Error(data?.error || 'Paiement indisponible pour le moment.')
      window.location.href = data.payment_url
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="px-4 pt-4 pb-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-ink2 mb-3">
        <ArrowLeft size={16} />
        Retour
      </button>

      <div className="bg-gradient-to-br from-indigo to-fb rounded-lg p-5 text-white mb-4">
        <Crown size={26} className="text-marigold fill-marigold mb-2" />
        <h1 className="text-xl font-bold">Passez Premium</h1>
        <p className="text-white/85 text-sm mt-1">
          Boostez votre visibilité et trouvez plus de clients sur ArtisanConnect.
        </p>
        {dejaPremium && (
          <p className="mt-3 bg-white/15 rounded-md px-3 py-2 text-sm">
            Premium actif jusqu'au{' '}
            {new Date(artisanProfile.premium_until).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            . Vous pouvez renouveler ou prolonger dès maintenant.
          </p>
        )}
      </div>

      <div className="space-y-2 mb-5">
        {AVANTAGES.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 shadow-sm">
            <span className="w-8 h-8 rounded-full bg-marigold/15 flex items-center justify-center shrink-0">
              <Icon size={15} className="text-marigold" />
            </span>
            <p className="text-sm text-ink">{text}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {Object.entries(PLANS).map(([key, p]) => (
          <button
            key={key}
            onClick={() => setPlan(key)}
            className={`text-left rounded-lg border-2 p-4 transition ${
              plan === key ? 'border-fb bg-fb/5' : 'border-border bg-card'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">{p.label}</span>
              {plan === key && <Check size={16} className="text-fb" />}
            </div>
            <p className="text-2xl font-bold text-ink mt-1">
              {p.amount.toLocaleString('fr-FR')} <span className="text-xs font-normal text-ink2">FCFA{p.sousLabel}</span>
            </p>
            {p.economie && <p className="text-[11px] text-green font-medium mt-1">{p.economie}</p>}
          </button>
        ))}
      </div>

      {error && <p className="text-red text-sm bg-red/10 rounded-md px-3 py-2 mb-3">{error}</p>}

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-fb text-white font-semibold py-3.5 rounded-md disabled:opacity-60 active:scale-[0.99] transition hover:bg-fb-dark"
      >
        <Crown size={18} />
        {loading ? 'Redirection vers le paiement…' : `Payer ${PLANS[plan].amount.toLocaleString('fr-FR')} FCFA`}
      </button>
      <p className="text-center text-[11px] text-ink2 mt-3">
        Paiement sécurisé via Wave, Orange Money, Free Money ou carte bancaire (CinetPay).
      </p>
    </div>
  )
}
