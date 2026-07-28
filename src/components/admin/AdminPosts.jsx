import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Loader from '../Loader'
import { formatDate } from '../../lib/utils'

export default function AdminPosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    supabase
      .from('posts')
      .select('*, artisans_profiles(id, profiles(nom_complet))')
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        setPosts(data || [])
        setLoading(false)
      })
  }, [])

  const supprimer = async (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id))
    setConfirmId(null)
    await supabase.from('posts').delete().eq('id', id)
  }

  if (loading) return <Loader label="Chargement des publications…" />
  if (posts.length === 0) return <p className="text-sm text-ink2 text-center py-8">Aucune publication.</p>

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {posts.map((post) => (
        <div key={post.id} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="aspect-square bg-bg relative">
            {post.media_type === 'video' ? (
              <video src={post.media_url} className="w-full h-full object-cover" muted />
            ) : (
              <img src={post.media_url} alt="" className="w-full h-full object-cover" />
            )}
            <button
              onClick={() => setConfirmId(post.id)}
              aria-label="Supprimer la publication"
              className="absolute top-1.5 right-1.5 bg-red text-white rounded-full p-1.5 shadow"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <div className="p-2">
            <Link to={`/artisan/${post.artisans_profiles?.id}`} className="text-xs font-semibold text-ink truncate block">
              {post.artisans_profiles?.profiles?.nom_complet}
            </Link>
            <p className="text-[10px] text-ink2">{formatDate(post.created_at)}</p>
          </div>

          {confirmId === post.id && (
            <div className="p-2 pt-0 flex gap-1.5">
              <button
                onClick={() => supprimer(post.id)}
                className="flex-1 bg-red text-white text-[11px] font-semibold py-1.5 rounded-md"
              >
                Confirmer
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 bg-bg text-ink2 text-[11px] font-semibold py-1.5 rounded-md"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
