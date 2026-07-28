import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="bg-ink text-white text-xs font-medium flex items-center justify-center gap-1.5 py-1.5 safe-top">
      <WifiOff size={12} />
      Pas de connexion — certaines actions sont indisponibles
    </div>
  )
}
