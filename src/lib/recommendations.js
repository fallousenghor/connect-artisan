import { supabase } from './supabase'
import { distanceKm } from './utils'
import { isPremium } from './premium'

/**
 * Calcule un score d'affinité par métier pour un utilisateur, à partir de :
 * - ses "j'aime" sur des publications (poids 1)
 * - ses avis publiés, pondérés par la note donnée (poids 1 à 2)
 *
 * Retourne un objet { [metier_id]: score }.
 */
export async function getUserAffinity(userId) {
  const weights = {}
  if (!userId) return weights

  const [{ data: likes }, { data: reviews }] = await Promise.all([
    supabase
      .from('post_likes')
      .select('posts(artisans_profiles(metier_id))')
      .eq('user_id', userId),
    supabase
      .from('reviews')
      .select('note, artisans_profiles(metier_id)')
      .eq('client_id', userId),
  ])

  likes?.forEach((l) => {
    const metierId = l.posts?.artisans_profiles?.metier_id
    if (metierId) weights[metierId] = (weights[metierId] || 0) + 1
  })

  reviews?.forEach((r) => {
    const metierId = r.artisans_profiles?.metier_id
    if (metierId) weights[metierId] = (weights[metierId] || 0) + (r.note >= 4 ? 2 : 1)
  })

  return weights
}

/**
 * Récupère les ids d'artisans déjà notés par l'utilisateur, pour ne pas
 * lui re-suggérer quelqu'un qu'il connaît déjà.
 */
export async function getReviewedArtisanIds(userId) {
  if (!userId) return new Set()
  const { data } = await supabase.from('reviews').select('artisan_id').eq('client_id', userId)
  return new Set((data || []).map((r) => r.artisan_id))
}

/**
 * Attribue un score à un artisan selon : affinité métier, note moyenne,
 * badge vérifié, disponibilité, et proximité géographique si connue.
 */
export function scoreArtisan(artisan, affinity, position) {
  let score = 0
  score += (affinity[artisan.metier_id] || 0) * 3
  score += Number(artisan.note_moyenne || 0)
  score += artisan.verifie ? 1 : 0
  score += artisan.disponible ? 0.5 : 0
  score += isPremium(artisan) ? 2 : 0 // légère mise en avant pour les artisans premium, sans écraser la pertinence

  if (position && artisan.latitude != null && artisan.longitude != null) {
    const d = distanceKm(position.lat, position.lng, artisan.latitude, artisan.longitude)
    if (d !== null) score += Math.max(0, 3 - d / 5) // bonus dégressif jusqu'à ~15 km
  }

  return score
}

/** Détermine le métier dominant (le plus pondéré) dans une carte d'affinité. */
export function dominantMetierId(affinity) {
  const entries = Object.entries(affinity)
  if (entries.length === 0) return null
  return Number(entries.sort((a, b) => b[1] - a[1])[0][0])
}
