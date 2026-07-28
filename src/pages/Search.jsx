import { useEffect, useMemo, useState } from 'react'
import { Search as SearchIcon, MapPin, SlidersHorizontal, LocateFixed, Wand2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ArtisanCard from '../components/ArtisanCard'
import Loader from '../components/Loader'
import { distanceKm } from '../lib/utils'

export default function Search() {
  const [metiers, setMetiers] = useState([])
  const [artisans, setArtisans] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [metierId, setMetierId] = useState('')
  const [ville, setVille] = useState('')
  const [disponibleSeulement, setDisponibleSeulement] = useState(false)
  const [noteMin, setNoteMin] = useState(0)
  const [triDistance, setTriDistance] = useState(false)
  const [position, setPosition] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    supabase.from('metiers').select('*').order('nom').then(({ data }) => setMetiers(data || []))
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      let req = supabase
        .from('artisans_profiles')
        .select('*, profiles(nom_complet, avatar_url, telephone, whatsapp), metiers(nom, icone)')
        .order('note_moyenne', { ascending: false })

      if (metierId) req = req.eq('metier_id', metierId)
      if (ville) req = req.ilike('ville', `%${ville}%`)
      if (disponibleSeulement) req = req.eq('disponible', true)
      if (noteMin > 0) req = req.gte('note_moyenne', noteMin)

      const { data, error } = await req
      if (!active) return
      if (!error) setArtisans(data || [])
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [metierId, ville, disponibleSeulement, noteMin])

  const [assistantLoading, setAssistantLoading] = useState(false)
  const [assistantSource, setAssistantSource] = useState(null) // 'ia' | 'local' | null

  const runAssistant = async () => {
    const text = query.trim()
    if (!text) return
    setAssistantLoading(true)
    setAssistantSource(null)

    try {
      const { data, error } = await supabase.functions.invoke('assistant-recherche', {
        body: { query: text, metiers: metiers.map((m) => ({ id: m.id, nom: m.nom })) },
      })

      if (error || !data || data.error) throw new Error(data?.error || error?.message || 'Échec')

      if (data.metier_id) setMetierId(String(data.metier_id))
      if (data.ville) setVille(data.ville)
      setAssistantSource('ia')
    } catch {
      // Repli : recherche locale par mots-clés (fonctionne toujours, même sans Edge Function déployée)
      const lower = text.toLowerCase()
      const foundMetier = metiers.find((m) => lower.includes(m.nom.toLowerCase().split(' ')[0]))
      if (foundMetier) setMetierId(String(foundMetier.id))

      const match = lower.match(/(?:à|a|dans|sur)\s+([a-zàâäéèêëîïôöùûüç\- ]+)$/i)
      if (match) setVille(match[1].trim())
      else if (!foundMetier) setVille(text)
      setAssistantSource('local')
    } finally {
      setAssistantLoading(false)
    }
  }

  const useMyPosition = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setTriDistance(true)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const results = useMemo(() => {
    let list = artisans.map((a) => ({
      ...a,
      distance: position ? distanceKm(position.lat, position.lng, a.latitude, a.longitude) : null,
    }))
    if (triDistance) {
      list = [...list].sort((a, b) => {
        if (a.distance === null) return 1
        if (b.distance === null) return -1
        return a.distance - b.distance
      })
    }
    return list
  }, [artisans, position, triDistance])

  return (
    <div className="px-3 pt-3 pb-4">
      <h1 className="text-xl font-bold text-ink mb-3 px-1">Trouver un artisan</h1>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <SearchIcon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runAssistant()}
            placeholder="Ex : plombier à Dakar"
            className="w-full rounded-full border border-border bg-card pl-10 pr-4 py-2.5 text-sm focus:border-fb outline-none"
          />
        </div>
        <button
          onClick={runAssistant}
          disabled={assistantLoading}
          aria-label="Lancer la recherche intelligente"
          className="rounded-full bg-fb text-white px-3.5 flex items-center justify-center shrink-0 disabled:opacity-60"
        >
          {assistantLoading ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Wand2 size={17} />
          )}
        </button>
        <button
          onClick={() => setShowFilters((v) => !v)}
          aria-label="Filtres"
          className={`rounded-full px-3.5 flex items-center justify-center shrink-0 border ${
            showFilters ? 'bg-fb text-white border-fb' : 'bg-card border-border text-ink2'
          }`}
        >
          <SlidersHorizontal size={17} />
        </button>
      </div>

      {assistantSource === 'local' && (
        <p className="text-xs text-ink2 mb-3 px-1">
          Recherche interprétée localement (assistant IA non configuré côté serveur).
        </p>
      )}

      {showFilters && (
        <div className="bg-card rounded-lg border border-border p-4 mb-4 space-y-4 shadow-sm">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink2 mb-1.5">Métier</label>
            <select
              value={metierId}
              onChange={(e) => setMetierId(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-fb"
            >
              <option value="">Tous les métiers</option>
              {metiers.map((m) => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink2 mb-1.5">Ville / Quartier</label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink2" />
              <input
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                placeholder="Ex : Dakar, Pikine…"
                className="w-full rounded-md border border-border bg-bg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-fb"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink2 mb-1.5">Note minimale</label>
            <div className="flex gap-2">
              {[0, 3, 4, 4.5].map((n) => (
                <button
                  key={n}
                  onClick={() => setNoteMin(n)}
                  className={`flex-1 rounded-md py-2 text-xs font-semibold border ${
                    noteMin === n ? 'bg-marigold border-marigold text-white' : 'bg-bg border-border text-ink2'
                  }`}
                >
                  {n === 0 ? 'Toutes' : `${n}+`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="dispo" className="text-sm font-medium">Disponible uniquement</label>
            <input
              id="dispo"
              type="checkbox"
              checked={disponibleSeulement}
              onChange={(e) => setDisponibleSeulement(e.target.checked)}
              className="w-5 h-5 accent-fb"
            />
          </div>

          <button
            onClick={useMyPosition}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-fb border border-fb/40 bg-fb/5 rounded-md py-2.5 hover:bg-fb/10 transition"
          >
            <LocateFixed size={16} />
            Trier par proximité (ma position)
          </button>
        </div>
      )}

      {loading && <Loader label="Recherche des artisans…" />}

      {!loading && results.length === 0 && (
        <div className="text-center py-16 bg-card border border-border rounded-lg">
          <p className="text-lg font-semibold text-ink mb-1">Aucun artisan trouvé</p>
          <p className="text-ink2 text-sm">Essayez d'élargir vos critères de recherche.</p>
        </div>
      )}

      <div className="space-y-2.5">
        {results.map((a) => (
          <ArtisanCard key={a.id} artisan={a} distance={a.distance} />
        ))}
      </div>
    </div>
  )
}
