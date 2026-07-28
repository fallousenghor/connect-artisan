import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Hammer, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(
        error.message.includes('Invalid login')
          ? 'Email ou mot de passe incorrect.'
          : error.message
      )
      return
    }
    navigate(location.state?.from || '/')
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reinitialiser',
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setForgotSent(true)
  }

  if (forgotMode) {
    return (
      <div className="px-5 pt-10 pb-10">
        <div className="text-center mb-8">
          <span className="w-14 h-14 rounded-full bg-fb/10 flex items-center justify-center mx-auto mb-3">
            <Mail size={24} className="text-fb" />
          </span>
          <h1 className="text-2xl font-bold text-ink">Mot de passe oublié</h1>
          <p className="text-ink2 mt-1 text-sm">Recevez un lien pour le réinitialiser</p>
        </div>

        {forgotSent ? (
          <div className="bg-card border border-border rounded-lg p-5 text-center shadow-sm">
            <p className="text-sm text-ink">
              Un lien de réinitialisation a été envoyé à <strong>{email}</strong> s'il correspond à un compte existant.
            </p>
            <button onClick={() => { setForgotMode(false); setForgotSent(false) }} className="mt-4 text-fb font-semibold text-sm">
              Retour à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgot} className="bg-card border border-border rounded-lg p-5 space-y-4 shadow-sm">
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-bg px-4 py-3 text-sm focus:border-fb focus:bg-card outline-none"
                placeholder="vous@exemple.com"
              />
            </div>
            {error && <p className="text-red text-sm bg-red/10 rounded-md px-3 py-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-fb text-white font-semibold py-3 rounded-md disabled:opacity-60 active:scale-[0.99] transition hover:bg-fb-dark"
            >
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
            <button type="button" onClick={() => setForgotMode(false)} className="w-full text-ink2 text-sm font-medium">
              Annuler
            </button>
          </form>
        )}
      </div>
    )
  }

  return (
    <div className="px-5 pt-10 pb-10">
      <div className="text-center mb-8">
        <span className="w-14 h-14 rounded-full bg-fb flex items-center justify-center mx-auto mb-3">
          <Hammer size={24} className="text-white" />
        </span>
        <h1 className="text-2xl font-bold text-ink">Content de vous revoir</h1>
        <p className="text-ink2 mt-1 text-sm">Connectez-vous pour retrouver vos artisans</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-5 space-y-4 shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-bg px-4 py-3 text-sm focus:border-fb focus:bg-card outline-none"
            placeholder="vous@exemple.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-bg px-4 py-3 text-sm focus:border-fb focus:bg-card outline-none"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-red text-sm bg-red/10 rounded-md px-3 py-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-fb text-white font-semibold py-3 rounded-md disabled:opacity-60 active:scale-[0.99] transition hover:bg-fb-dark"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>

        <button
          type="button"
          onClick={() => setForgotMode(true)}
          className="w-full text-fb text-sm font-medium text-center"
        >
          Mot de passe oublié ?
        </button>
      </form>

      <div className="text-center mt-5">
        <div className="border-t border-border pt-5">
          <Link
            to="/inscription"
            className="inline-block bg-green text-white font-semibold px-6 py-3 rounded-md hover:bg-green-dark transition"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}
