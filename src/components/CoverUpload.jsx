import { useState } from 'react'
import { Camera, Image as ImageIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function CoverUpload({ userId, url, onUploaded, editable = true }) {
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `covers/${userId}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('media').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (!uploadError) {
      const { data } = supabase.storage.from('media').getPublicUrl(path)
      await supabase.from('profiles').update({ cover_url: data.publicUrl }).eq('id', userId)
      onUploaded?.(data.publicUrl)
    }
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div className="relative w-full h-36 sm:h-44 bg-gradient-to-br from-fb to-fb-dark overflow-hidden">
      {url && <img src={url} alt="Photo de couverture" className="w-full h-full object-cover" />}
      {!url && (
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <ImageIcon size={40} className="text-card" />
        </div>
      )}
      {editable && (
        <>
          <label
            htmlFor={`cover-${userId}`}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-card/95 text-ink text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer shadow-sm hover:bg-card transition"
          >
            <Camera size={14} />
            Modifier la couverture
          </label>
          <input
            id={`cover-${userId}`}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
            disabled={uploading}
          />
        </>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-ink/40 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
