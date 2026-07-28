import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, WifiOff, X } from 'lucide-react'

export default function UpdateToast() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Vérifie les mises à jour toutes les heures pour les sessions longues
      registration && setInterval(() => registration.update(), 60 * 60 * 1000)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="fixed bottom-16 inset-x-3 z-50 max-w-lg mx-auto">
      <div className="bg-ink text-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-3">
        {needRefresh ? <RefreshCw size={18} className="shrink-0" /> : <WifiOff size={18} className="shrink-0" />}
        <p className="text-sm flex-1">
          {needRefresh
            ? 'Une nouvelle version est disponible.'
            : "L'application est prête à fonctionner hors-ligne."}
        </p>
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            className="shrink-0 bg-fb text-white text-xs font-semibold px-3 py-1.5 rounded-md"
          >
            Actualiser
          </button>
        )}
        <button onClick={close} aria-label="Fermer" className="shrink-0 p-1">
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
