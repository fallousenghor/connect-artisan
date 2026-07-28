import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import { isPushSupported, getPushSubscriptionStatus, subscribeToPush, unsubscribeFromPush } from '../lib/push'

export default function NotificationSettings({ userId }) {
  const [status, setStatus] = useState('checking')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isPushSupported()) {
      setStatus('unsupported')
      return
    }
    getPushSubscriptionStatus().then(setStatus)
  }, [])

  const toggle = async () => {
    setBusy(true)
    setError('')
    try {
      if (status === 'subscribed') {
        await unsubscribeFromPush()
        setStatus('unsubscribed')
      } else {
        await subscribeToPush(userId)
        setStatus('subscribed')
      }
    } catch (err) {
      setError(err.message === 'Permission refusée.' ? 'Autorisation refusée par le navigateur.' : "Impossible d'activer les notifications.")
      setStatus(await getPushSubscriptionStatus())
    } finally {
      setBusy(false)
    }
  }

  if (status === 'unsupported') return null

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-fb/10 flex items-center justify-center shrink-0">
          {status === 'subscribed' ? <BellRing size={18} className="text-fb" /> : <Bell size={18} className="text-ink2" />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">Notifications push</p>
          <p className="text-xs text-ink2">Soyez alerté dès qu'un message arrive</p>
        </div>
        {status === 'denied' ? (
          <span className="text-xs text-ink2 flex items-center gap-1 shrink-0">
            <BellOff size={13} /> Bloquées
          </span>
        ) : (
          <button
            onClick={toggle}
            disabled={busy || status === 'checking'}
            className={`shrink-0 text-xs font-semibold px-3.5 py-2 rounded-md transition disabled:opacity-60 ${
              status === 'subscribed' ? 'bg-bg text-ink2 hover:bg-border/40' : 'bg-fb text-white hover:bg-fb-dark'
            }`}
          >
            {busy ? '…' : status === 'subscribed' ? 'Désactiver' : 'Activer'}
          </button>
        )}
      </div>
      {status === 'denied' && (
        <p className="text-xs text-ink2 mt-2.5">
          Les notifications sont bloquées pour ce site. Autorisez-les dans les réglages de votre navigateur pour les activer.
        </p>
      )}
      {error && <p className="text-xs text-red mt-2.5">{error}</p>}
    </div>
  )
}
