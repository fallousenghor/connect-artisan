import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, ShieldCheck, ShieldOff, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import MetierIcon from '../MetierIcon'
import Loader from '../Loader'

export default function AdminArtisans() {
  const [artisans, setArtisans] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filtre, setFiltre] = useState('tous') // 'tous' | 'a_verifier' | 'verifies'

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('artisans_profiles')
      .select('*, profiles(nom_complet, avatar_url, telephone), metiers(nom, icone)')
      .order('created_at', { ascending: false })
    setArtisans(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const toggleVerifie = async (id, current) => {
    setArtisans((prev) => prev.map((a) => (a.id === id ? { ...a, verifie: !current } : a)))
    await supabase.from('artisans_profiles').update({ verifie: !current }).eq('id', id)
  }

  const filtered = artisans.filter((a) => {
    const matchQuery = !query || a.profiles?.nom_complet?.toLowerCase().includes(query.toLowerCase()) || a.ville?.toLowerCase().includes(query.toLowerCase())
    const matchFiltre = filtre === 'tous' || (filtre === 'a_verifier' && !a.verifie) || (filtre === 'verifies' && a.verifie)
    return matchQuery && matchFiltre
  })

  if (loading) return <Loader label="Chargement des artisans…" />

  return (
    <div>
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un artisan…"
          className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2.5 text-sm outline-none focus:border-fb"
        />
      </div>

      <div className="flex gap-2 mb-3">
        {[
          { key: 'tous', label: 'Tous' },
          { key: 'a_verifier', label: 'À vérifier' },
          { key: 'verifies', label: 'Vérifiés' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltre(f.key)}
            className={`flex-1 rounded-md py-2 text-xs font-semibold border ${
              filtre === f.key ? 'bg-fb border-fb text-white' : 'bg-card border-border text-ink2'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((a) => (
          <div key={a.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 shadow-sm">
            <Link to={`/artisan/${a.id}`} className="w-11 h-11 rounded-full bg-fb overflow-hidden flex items-center justify-center shrink-0">
              {a.profiles?.avatar_url ? (
                <img src={a.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <MetierIcon icone={a.metiers?.icone} size={18} className="text-white" />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold text-ink truncate">{a.profiles?.nom_complet}</p>
                {a.verifie && <BadgeCheck size={13} className="text-fb shrink-0" />}
              </div>
              <p className="text-xs text-ink2 truncate">{a.metiers?.nom} · {a.ville || 'Ville non renseignée'}</p>
            </div>
            <button
              onClick={() => toggleVerifie(a.id, a.verifie)}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-md transition ${
                a.verifie ? 'bg-bg text-ink2 hover:bg-border/40' : 'bg-green text-white hover:bg-green-dark'
              }`}
            >
              {a.verifie ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
              {a.verifie ? 'Retirer' : 'Vérifier'}
            </button>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-ink2 text-center py-8">Aucun artisan trouvé.</p>}
      </div>
    </div>
  )
}
