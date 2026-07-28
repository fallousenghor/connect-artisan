import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, MapPinned, Save, Star, Image as ImageIcon, Trash2, ShieldAlert } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import AvatarUpload from '../components/AvatarUpload'
import CoverUpload from '../components/CoverUpload'
import NotificationSettings from '../components/NotificationSettings'
import Loader from '../components/Loader'
import { isPremium } from '../lib/premium'
import { Crown } from 'lucide-react'

export default function MyProfile() {
  const { user, profile, artisanProfile, isArtisan, refreshProfile, signOut } = useAuth()
  const [metiers, setMetiers] = useState([])
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [posts, setPosts] = useState([])
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (isArtisan) {
      supabase.from('metiers').select('*').order('nom').then(({ data }) => setMetiers(data || []))
      supabase
        .from('posts')
        .select('*')
        .eq('artisan_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setPosts(data || []))
    }
  }, [isArtisan, user])

  useEffect(() => {
    if (!profile) return
    setForm({
      nom_complet: profile.nom_complet || '',
      telephone: profile.telephone || '',
      whatsapp: profile.whatsapp || '',
      metier_id: artisanProfile?.metier_id || '',
      description: artisanProfile?.description || '',
      ville: artisanProfile?.ville || '',
      quartier: artisanProfile?.quartier || '',
      disponible: artisanProfile?.disponible ?? true,
      latitude: artisanProfile?.latitude ?? null,
      longitude: artisanProfile?.longitude ?? null,
    })
  }, [profile, artisanProfile])

  const detectPosition = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }))
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nom_complet: form.nom_complet,
        telephone: form.telephone,
        whatsapp: form.whatsapp,
      })
      .eq('id', user.id)

    let artisanError = null
    if (isArtisan) {
      const res = await supabase
        .from('artisans_profiles')
        .update({
          metier_id: form.metier_id || null,
          description: form.description,
          ville: form.ville,
          quartier: form.quartier,
          disponible: form.disponible,
          latitude: form.latitude,
          longitude: form.longitude,
        })
        .eq('id', user.id)
      artisanError = res.error
    }

    setSaving(false)
    if (profileError || artisanError) {
      setMessage("Une erreur est survenue lors de l'enregistrement.")
    } else {
      setMessage('Profil mis à jour avec succès.')
      refreshProfile()
    }
  }

  const deletePost = async (id) => {
    await supabase.from('posts').delete().eq('id', id)
    setPosts((p) => p.filter((post) => post.id !== id))
  }

  if (!form) return <Loader label="Chargement du profil…" />

  return (
    <div className="pb-10">
      <div className="bg-card border-b border-border">
        <CoverUpload userId={user.id} url={profile.cover_url} onUploaded={refreshProfile} />
        <div className="px-5">
          <div className="flex items-end justify-between -mt-10">
            <AvatarUpload
              userId={user.id}
              url={profile.avatar_url}
              nom={profile.nom_complet}
              size={88}
              onUploaded={refreshProfile}
            />
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-sm font-semibold text-ink bg-bg rounded-md px-3.5 py-2 mb-1 hover:bg-border/40 transition"
            >
              <LogOut size={15} />
              Déconnexion
            </button>
          </div>
          <div className="py-3">
            <h1 className="text-xl font-bold text-ink">{profile.nom_complet}</h1>
            <p className="text-ink2 text-sm">{isArtisan ? 'Compte artisan' : 'Compte client'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <NotificationSettings userId={user.id} />

        {profile.role === 'admin' && (
          <Link
            to="/admin"
            className="flex items-center gap-3 bg-card border border-border rounded-lg p-4 shadow-sm hover:bg-hover transition"
          >
            <span className="w-10 h-10 rounded-full bg-fb/10 flex items-center justify-center shrink-0">
              <ShieldAlert size={18} className="text-fb" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">Administration</p>
              <p className="text-xs text-ink2">Vérifier des artisans, modérer publications et avis</p>
            </div>
          </Link>
        )}

        {isArtisan && artisanProfile && (
          <Link
            to="/premium"
            className={`flex items-center gap-3 rounded-lg p-4 shadow-sm transition ${
              isPremium(artisanProfile)
                ? 'bg-gradient-to-br from-indigo to-fb text-white'
                : 'bg-card border border-border hover:bg-hover'
            }`}
          >
            <span
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isPremium(artisanProfile) ? 'bg-white/15' : 'bg-marigold/15'
              }`}
            >
              <Crown size={18} className="text-marigold fill-marigold" />
            </span>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${isPremium(artisanProfile) ? 'text-white' : 'text-ink'}`}>
                {isPremium(artisanProfile) ? 'Compte Premium actif' : 'Passer Premium'}
              </p>
              <p className={`text-xs ${isPremium(artisanProfile) ? 'text-white/80' : 'text-ink2'}`}>
                {isPremium(artisanProfile)
                  ? `Jusqu'au ${new Date(artisanProfile.premium_until).toLocaleDateString('fr-FR')}`
                  : 'Boostez votre visibilité auprès des clients'}
              </p>
            </div>
          </Link>
        )}

        {isArtisan && artisanProfile && (
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-card border border-border rounded-lg p-3 text-center shadow-sm">
              <p className="text-xl font-bold text-ink">{artisanProfile.note_moyenne || 0}</p>
              <p className="text-[11px] text-ink2 flex items-center justify-center gap-0.5"><Star size={10} /> Note</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center shadow-sm">
              <p className="text-xl font-bold text-ink">{artisanProfile.nombre_avis || 0}</p>
              <p className="text-[11px] text-ink2">Avis</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center shadow-sm">
              <p className="text-xl font-bold text-ink">{posts.length}</p>
              <p className="text-[11px] text-ink2">Publications</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-card border border-border rounded-lg p-4 shadow-sm space-y-4">
          <h2 className="font-semibold text-base">Informations personnelles</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Nom complet</label>
            <input
              value={form.nom_complet}
              onChange={(e) => setForm({ ...form, nom_complet: e.target.value })}
              className="w-full rounded-md border border-border bg-bg px-4 py-3 text-sm focus:border-fb focus:bg-card outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Téléphone</label>
              <input
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                className="w-full rounded-md border border-border bg-bg px-4 py-3 text-sm focus:border-fb focus:bg-card outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">WhatsApp</label>
              <input
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full rounded-md border border-border bg-bg px-4 py-3 text-sm focus:border-fb focus:bg-card outline-none"
              />
            </div>
          </div>

          {isArtisan && (
            <>
              <div className="border-t border-border pt-4">
                <h2 className="font-semibold text-base mb-3">Informations professionnelles</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Métier</label>
                    <select
                      value={form.metier_id}
                      onChange={(e) => setForm({ ...form, metier_id: e.target.value })}
                      className="w-full rounded-md border border-border bg-bg px-4 py-3 text-sm focus:border-fb focus:bg-card outline-none"
                    >
                      <option value="">Choisir un métier</option>
                      {metiers.map((m) => (
                        <option key={m.id} value={m.id}>{m.nom}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      placeholder="Présentez votre expérience et vos spécialités…"
                      className="w-full rounded-md border border-border bg-bg px-4 py-3 text-sm focus:border-fb focus:bg-card outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Ville</label>
                      <input
                        value={form.ville}
                        onChange={(e) => setForm({ ...form, ville: e.target.value })}
                        placeholder="Dakar"
                        className="w-full rounded-md border border-border bg-bg px-4 py-3 text-sm focus:border-fb focus:bg-card outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Quartier</label>
                      <input
                        value={form.quartier}
                        onChange={(e) => setForm({ ...form, quartier: e.target.value })}
                        placeholder="Sacré-Cœur"
                        className="w-full rounded-md border border-border bg-bg px-4 py-3 text-sm focus:border-fb focus:bg-card outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={detectPosition}
                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-fb border border-fb/40 bg-fb/5 rounded-md py-2.5 hover:bg-fb/10 transition"
                  >
                    <MapPinned size={16} />
                    {locating ? 'Localisation…' : form.latitude ? 'Position enregistrée ✓ (mettre à jour)' : 'Utiliser ma position actuelle'}
                  </button>

                  <div className="flex items-center justify-between bg-bg rounded-md px-4 py-3">
                    <label htmlFor="dispo" className="text-sm font-medium">Disponible pour de nouvelles missions</label>
                    <input
                      id="dispo"
                      type="checkbox"
                      checked={form.disponible}
                      onChange={(e) => setForm({ ...form, disponible: e.target.checked })}
                      className="w-5 h-5 accent-fb"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {message && <p className="text-green text-sm">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-fb text-white font-semibold py-3 rounded-md disabled:opacity-60 active:scale-[0.99] transition hover:bg-fb-dark"
          >
            <Save size={18} />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>

        {isArtisan && (
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-base">Mes publications</h2>
              <Link to="/publier" className="text-fb text-sm font-semibold">+ Ajouter</Link>
            </div>
            {posts.length === 0 ? (
              <p className="text-sm text-ink2 flex items-center gap-1.5"><ImageIcon size={14} /> Aucune publication.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {posts.map((post) => (
                  <div key={post.id} className="relative aspect-square rounded-md overflow-hidden bg-bg group">
                    {post.media_type === 'video' ? (
                      <video src={post.media_url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => deletePost(post.id)}
                      aria-label="Supprimer la publication"
                      className="absolute top-1 right-1 bg-ink/70 text-white rounded-full p-1.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
