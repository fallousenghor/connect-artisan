// Distance haversine en kilomètres entre deux points GPS
export function distanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v === null || v === undefined)) return null
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function formatDistance(km) {
  if (km === null || km === undefined) return null
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function telHref(phone) {
  return `tel:${phone.replace(/\s+/g, '')}`
}

export function whatsappHref(phone, message = '') {
  const clean = phone.replace(/[^\d+]/g, '')
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${clean.replace('+', '')}${message ? `?text=${encoded}` : ''}`
}
