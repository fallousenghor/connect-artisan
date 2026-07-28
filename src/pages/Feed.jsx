import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'
import StoriesBar from '../components/StoriesBar'
import SuggestedArtisans from '../components/SuggestedArtisans'
import RecommendedArtisans from '../components/RecommendedArtisans'
import PremiumPromoBanner from '../components/PremiumPromoBanner'
import Loader from '../components/Loader'

export default function Feed() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [likedIds, setLikedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('posts')
        .select(
          '*, post_likes(count), artisans_profiles(id, note_moyenne, nombre_avis, verifie, premium_until, ville, disponible, profiles(nom_complet, avatar_url, telephone, whatsapp), metiers(nom, icone))'
        )
        .order('created_at', { ascending: false })
        .limit(30)

      if (!active) return
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      setPosts(data || [])

      if (user && data?.length) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', data.map((p) => p.id))
        if (active) setLikedIds(new Set((likes || []).map((l) => l.post_id)))
      }
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [user])

  const toggleLike = async (postId) => {
    if (!user) {
      navigate('/connexion')
      return
    }
    const alreadyLiked = likedIds.has(postId)

    setLikedIds((prev) => {
      const next = new Set(prev)
      alreadyLiked ? next.delete(postId) : next.add(postId)
      return next
    })
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post
        const current = post.post_likes?.[0]?.count ?? 0
        return { ...post, post_likes: [{ count: alreadyLiked ? Math.max(0, current - 1) : current + 1 }] }
      })
    )

    if (alreadyLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id)
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id })
    }
  }

  return (
    <div className="px-3 pt-3">
      <Link
        to="/recherche"
        className="flex items-center gap-2 mb-3 bg-card border border-border rounded-lg px-4 py-3 shadow-sm text-sm text-ink2"
      >
        <Search size={16} />
        Chercher un plombier, électricien, maçon…
      </Link>

      <StoriesBar />
      <PremiumPromoBanner />
      {user ? <RecommendedArtisans /> : <SuggestedArtisans />}

      {loading && <Loader label="Chargement du fil…" />}
      {error && <p className="text-red text-sm bg-red/10 rounded-md px-3 py-2">{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-16 bg-card border border-border rounded-lg">
          <p className="text-lg font-semibold text-ink mb-1">Aucune publication pour l'instant</p>
          <p className="text-ink2 text-sm">Soyez le premier artisan à publier une réalisation.</p>
        </div>
      )}

      <div className="space-y-3 pb-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            likesCount={post.post_likes?.[0]?.count ?? 0}
            likedByMe={likedIds.has(post.id)}
            onToggleLike={() => toggleLike(post.id)}
          />
        ))}
      </div>
    </div>
  )
}
