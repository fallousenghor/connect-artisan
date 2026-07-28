import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // Si la session de récupération est déjà active au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSuccess(true)
    setTimeout(() => navigate('/', { replace: true }), 1500)
  }

  if (!ready) {
    return (
      <div className="px-6 pt-16 text-center">
        <p className="text-ink2 text-sm">
          Ce lien n'est plus valide ou a déjà été utilisé. Redemandez un lien depuis la page de connexion.
        </p>
      </div>
    )
  }

  return (
    <div className="px-5 pt-10 pb-10">
      <div className="text-center mb-8">
        <span className="w-14 h-14 rounded-full bg-fb/10 flex items-center justify-center mx-auto mb-3">
          <KeyRound size={24} className="text-fb" />
        </span>
        <h1 className="text-2xl font-bold text-ink">Nouveau mot de passe</h1>
        <p className="text-ink2 mt-1 text-sm">Choisissez un mot de passe pour votre compte</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-5 space-y-4 shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="password">Nouveau mot de passe</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-bg px-4 py-3 text-sm focus:border-fb focus:bg-card outline-none"
            placeholder="6 caractères minimum"
          />
        </div>

        {error && <p className="text-red text-sm bg-red/10 rounded-md px-3 py-2">{error}</p>}
        {success && <p className="text-green text-sm bg-green/10 rounded-md px-3 py-2">Mot de passe mis à jour ! Redirection…</p>}

        <button
          type="submit"
          disabled={loading || success}
          className="w-full bg-fb text-white font-semibold py-3 rounded-md disabled:opacity-60 active:scale-[0.99] transition hover:bg-fb-dark"
        >
          {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
        </button>
      </form>
    </div>
  )
}
