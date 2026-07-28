import { useEffect, useState } from 'react'
import { Download, X, Share, SquarePlus } from 'lucide-react'
import { usePwaInstall } from '../lib/usePwaInstall'

const DISMISS_KEY = 'artisanconnect_install_dismissed_at'
const DISMISS_DAYS = 14

export default function InstallBanner() {
  const { installed, canInstallAndroid, isIOS, promptInstall } = usePwaInstall()
  const [dismissed, setDismissed] = useState(true)
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  useEffect(() => {
    const last = Number(localStorage.getItem(DISMISS_KEY) || 0)
    const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24)
    setDismissed(daysSince < DISMISS_DAYS)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setDismissed(true)
  }

  if (installed || dismissed) return null
  if (!canInstallAndroid && !isIOS) return null

  return (
    <>
      <div className="mx-3 mt-3 bg-card border border-border rounded-lg shadow-sm p-3.5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-fb flex items-center justify-center shrink-0">
          <Download size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">Installer ArtisanConnect</p>
          <p className="text-xs text-ink2">Accès rapide depuis votre écran d'accueil, comme une app.</p>
        </div>
        <button
          onClick={() => (canInstallAndroid ? promptInstall().then((ok) => ok && dismiss()) : setShowIOSHelp(true))}
          className="shrink-0 bg-fb text-white text-xs font-semibold px-3.5 py-2 rounded-md hover:bg-fb-dark transition"
        >
          Installer
        </button>
        <button onClick={dismiss} aria-label="Fermer" className="shrink-0 text-ink2 p-1">
          <X size={16} />
        </button>
      </div>

      {showIOSHelp && (
        <div
          className="fixed inset-0 z-50 bg-ink/50 flex items-end sm:items-center justify-center"
          onClick={() => setShowIOSHelp(false)}
        >
          <div
            className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-ink mb-3">Installer sur iPhone / iPad</p>
            <ol className="space-y-3 text-sm text-ink">
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-fb text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <span className="flex items-center gap-1.5">
                  Appuyez sur l'icône <Share size={15} className="inline text-fb" /> « Partager » dans Safari
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-fb text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <span className="flex items-center gap-1.5">
                  Choisissez <SquarePlus size={15} className="inline text-fb" /> « Sur l'écran d'accueil »
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-fb text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <span>Confirmez avec « Ajouter »</span>
              </li>
            </ol>
            <button
              onClick={() => {
                setShowIOSHelp(false)
                dismiss()
              }}
              className="w-full mt-5 bg-fb text-white font-semibold py-2.5 rounded-md text-sm"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  )
}
