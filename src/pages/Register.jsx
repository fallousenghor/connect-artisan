import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Wrench, User, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [role, setRole] = useState('client')
  const [nomComplet, setNomComplet] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          nom_complet: nomComplet,
          telephone,
          whatsapp: telephone,
        },
      },
    })

    setLoading(false)

    if (error) {
      setError(
        error.message.includes('already registered')
          ? 'Un compte existe déjà avec cet email.'
          : error.message
      )
      return
    }

    if (data.session) {
      navigate(role === 'artisan' ? '/profil' : '/', { replace: true })
    } else {
      setEmailSent(true)
    }
  }

  if (emailSent) {
    return (
      <div className="px-6 pt-16 text-center">
        <div className="w-16 h-16 rounded-full bg-fb/10 flex items-center justify-center mx-auto mb-5">
          <Mail className="text-fb" size={28} />
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">Vérifiez votre email</h1>
        <p className="text-ink2 text-sm">
          Un lien de confirmation a été envoyé à <strong>{email}</strong>. Cliquez dessus pour activer votre compte, puis connectez-vous.
        </p>
        <Link to="/connexion" className="inline-block mt-6 text-fb font-semibold text-sm">
          Aller à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div className="px-5 pt-8 pb-10">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-ink">Rejoindre ArtisanConnect</h1>
        <p className="text-ink2 mt-1 text-sm">Trouvez un artisan ou proposez vos services</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => setRole('client')}
            className={`flex flex-col items-center gap-2 rounded-md border-2 py-4 transition ${
              role === 'client' ? 'border-fb bg-fb/5' : 'border-border bg-bg'
            }`}
          >
            <User size={22} className={role === 'client' ? 'text-fb' : 'text-ink2'} />
            <span className="text-sm font-semibold">Je cherche un artisan</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('artisan')}
            className={`flex flex-col items-center gap-2 rounded-md border-2 py-4 transition ${
              role === 'artisan' ? 'border-fb bg-fb/5' : 'border-border bg-bg'
            }`}
          >
            <Wrench size={22} className={role === 'artisan' ? 'text-fb' : 'text-ink2'} />
            <span className="text-sm font-semibold">Je suis artisan</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="nom">Nom complet</label>
            <input
              id="nom"
              required
              value={nomComplet}
              onChange={(e) => setNomComplet(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-4 py-3 text-sm focus:border-fb focus:bg-card outline-none"
              placeholder="Ex : Moussa Diop"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="tel">Téléphone (WhatsApp)</label>
            <input
              id="tel"
              type="tel"
              required
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-4 py-3 text-sm focus:border-fb focus:bg-card outline-none"
              placeholder="+221 77 000 00 00"
            />
          </div>
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-4 py-3 text-sm focus:border-fb focus:bg-card outline-none"
              placeholder="6 caractères minimum"
            />
          </div>

          {error && <p className="text-red text-sm bg-red/10 rounded-md px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green text-white font-semibold py-3 rounded-md disabled:opacity-60 active:scale-[0.99] transition hover:bg-green-dark"
          >
            <UserPlus size={18} />
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-ink2 mt-5">
        Déjà inscrit ?{' '}
        <Link to="/connexion" className="text-fb font-semibold">Se connecter</Link>
      </p>
    </div>
  )
}
