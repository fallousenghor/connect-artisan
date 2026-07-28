import { useState } from 'react'
import { Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AvatarUpload({ userId, url, nom, size = 96, onUploaded }) {
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `avatars/${userId}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('media').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (!uploadError) {
      const { data } = supabase.storage.from('media').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId)
      onUploaded?.(data.publicUrl)
    }
    setUploading(false)
    e.target.value = ''
  }

  const initiale = nom?.trim()?.[0]?.toUpperCase() || '?'

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full overflow-hidden bg-fb flex items-center justify-center border-4 border-card"
        style={{ fontSize: size / 2.4 }}
      >
        {url ? (
          <img src={url} alt="Photo de profil" className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-card">{initiale}</span>
        )}
      </div>
      <label
        htmlFor={`avatar-${userId}`}
        className="absolute bottom-0 right-0 bg-hover border-2 border-card rounded-full p-1.5 cursor-pointer shadow-sm hover:bg-border/40 transition"
        aria-label="Changer la photo de profil"
      >
        <Camera size={14} className="text-ink" />
      </label>
      <input
        id={`avatar-${userId}`}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
        disabled={uploading}
      />
      {uploading && (
        <div className="absolute inset-0 rounded-full bg-ink/40 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
