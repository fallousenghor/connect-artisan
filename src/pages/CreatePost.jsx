import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus, Upload, Sparkles, X, TriangleAlert } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Repli local (sans IA) si la Edge Function "analyser-image" n'est pas déployée
const MOTS_CLES = [
  'fuite', 'tuyau', 'robinet', 'câble', 'prise', 'peinture', 'mur', 'carrelage',
  'porte', 'fenêtre', 'toiture', 'soudure', 'jardin', 'coiffure', 'couture',
]
function extraireTagsLocal(description) {
  const texte = description.toLowerCase()
  return MOTS_CLES.filter((mot) => texte.includes(mot))
}

export default function CreatePost() {
  const { user, artisanProfile } = useAuth()
  const navigate = useNavigate()
  const [metiers, setMetiers] = useState([])
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [mediaUrl, setMediaUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [tags, setTags] = useState([])
  const [description, setDescription] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('metiers').select('*').then(({ data }) => setMetiers(data || []))
  }, [])

  const handleFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setError('')
    setAnalysis(null)
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setMediaUrl(null)

    setUploading(true)
    const ext = f.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('media').upload(path, f, {
      cacheControl: '3600',
      upsert: false,
    })
    setUploading(false)

    if (uploadError) {
      setError("Échec de l'envoi du fichier. Réessayez.")
      return
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
    setMediaUrl(urlData.publicUrl)

    if (f.type.startsWith('image')) {
      analyserImage(urlData.publicUrl)
    }
  }

  const analyserImage = async (url) => {
    setAnalyzing(true)
    try {
      const { data, error } = await supabase.functions.invoke('analyser-image', {
        body: { image_url: url, metiers: metiers.map((m) => ({ id: m.id, nom: m.nom })) },
      })
      if (error || !data || data.error) throw new Error('indisponible')

      setAnalysis(data)
      if (Array.isArray(data.tags) && data.tags.length) setTags(data.tags)
      if (data.description_suggestion && !description) setDescription(data.description_suggestion)
    } catch {
      // Repli silencieux : l'IA n'est pas configurée, l'utilisateur continue manuellement
    } finally {
      setAnalyzing(false)
    }
  }

  const removeTag = (t) => setTags((prev) => prev.filter((x) => x !== t))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!mediaUrl) {
      setError('Ajoutez une photo ou une vidéo de votre réalisation.')
      return
    }
    setPublishing(true)
    setError('')

    const tagsFinaux = tags.length ? tags : extraireTagsLocal(description)

    const { error: insertError } = await supabase.from('posts').insert({
      artisan_id: user.id,
      media_url: mediaUrl,
      media_type: file.type.startsWith('video') ? 'video' : 'image',
      description,
      tags: tagsFinaux,
    })

    setPublishing(false)

    if (insertError) {
      setError('Échec de la publication. Réessayez.')
      return
    }

    navigate('/profil', { replace: true })
  }

  const metierSuggere = analysis?.metier_id ? metiers.find((m) => m.id === analysis.metier_id) : null
  const metierActuel = metiers.find((m) => m.id === artisanProfile?.metier_id)
  const metierDifferent =
    metierSuggere && artisanProfile?.metier_id && metierSuggere.id !== artisanProfile.metier_id

  return (
    <div className="px-4 pt-4 pb-10">
      <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
        <h1 className="text-xl font-bold text-ink mb-1">Publier une réalisation</h1>
        <p className="text-ink2 text-sm mb-5">Montrez votre travail pour attirer de nouveaux clients.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label
            htmlFor="media"
            className="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-bg h-56 overflow-hidden cursor-pointer"
          >
            {preview ? (
              file.type.startsWith('video') ? (
                <video src={preview} className="w-full h-full object-cover" muted />
              ) : (
                <img src={preview} alt="Aperçu" className="w-full h-full object-cover" />
              )
            ) : (
              <>
                <ImagePlus size={30} className="text-ink2" />
                <span className="text-sm text-ink2">Ajouter une photo ou vidéo</span>
              </>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-ink/40 flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              </div>
            )}
            <input id="media" type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
          </label>

          {analyzing && (
            <p className="text-xs text-fb flex items-center gap-1.5">
              <Sparkles size={13} className="animate-pulse" />
              Analyse de la photo par IA en cours…
            </p>
          )}

          {analysis?.conforme === false && (
            <p className="text-xs text-red bg-red/10 rounded-md px-3 py-2 flex items-center gap-1.5">
              <TriangleAlert size={13} className="shrink-0" />
              Cette photo ne semble pas montrer clairement un travail d'artisanat. Vérifiez avant de publier.
            </p>
          )}

          {metierDifferent && (
            <p className="text-xs text-marigold bg-marigold/10 rounded-md px-3 py-2 flex items-center gap-1.5">
              <TriangleAlert size={13} className="shrink-0" />
              Cette photo ressemble plutôt à un travail de <strong>{metierSuggere.nom}</strong>, alors que votre métier
              enregistré est {metierActuel?.nom || '—'}. Publiez quand même si c'est correct.
            </p>
          )}

          {tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink2 uppercase tracking-wide mb-1.5">
                Mots-clés suggérés {analysis && <span className="normal-case text-fb">· par IA</span>}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 bg-fb/10 text-fb text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {t}
                    <button type="button" onClick={() => removeTag(t)} aria-label={`Retirer ${t}`}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="desc">Description</label>
            <textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Ex : Réparation d'une fuite sous évier à Sacré-Cœur, Dakar"
              className="w-full rounded-md border border-border bg-bg px-4 py-3 text-sm focus:border-fb focus:bg-card outline-none resize-none"
            />
          </div>

          {error && <p className="text-red text-sm bg-red/10 rounded-md px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={publishing || uploading}
            className="w-full flex items-center justify-center gap-2 bg-fb text-white font-semibold py-3 rounded-md disabled:opacity-60 active:scale-[0.99] transition hover:bg-fb-dark"
          >
            <Upload size={18} />
            {publishing ? 'Publication…' : 'Publier'}
          </button>
        </form>
      </div>
    </div>
  )
}
