import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'

const MAX_TENTATIVES = 10

export default function PremiumReturn() {
  const [searchParams] = useSearchParams()
  const transactionId = searchParams.get('transaction_id')
  const { refreshProfile } = useAuth()
  const [statut, setStatut] = useState('verification')

  useEffect(() => {
    if (!transactionId) {
      setStatut('echoue')
      return
    }

    let tentative = 0
    let annule = false

    const verifier = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('transaction_id', transactionId)
        .maybeSingle()

      if (annule) return

      if (data?.status === 'actif') {
        setStatut('actif')
        refreshProfile()
        return
      }
      if (data?.status === 'echoue') {
        setStatut('echoue')
        return
      }

      tentative++
      if (tentative >= MAX_TENTATIVES) {
        setStatut('en_attente')
        return
      }
      setTimeout(verifier, 2500)
    }

    verifier()
    return () => {
      annule = true
    }
  }, [transactionId, refreshProfile])

  return (
    <div className="px-6 pt-16 text-center">
      {statut === 'verification' && (
        <>
          <Loader label="Vérification du paiement…" />
          <p className="text-xs text-ink2 -mt-6">Cela peut prendre quelques secondes.</p>
        </>
      )}

      {statut === 'actif' && (
        <>
          <CheckCircle2 size={44} className="text-green mx-auto mb-3" />
          <h1 className="text-xl font-bold text-ink mb-1">Paiement confirmé !</h1>
          <p className="text-ink2 text-sm mb-6">Votre compte Premium est maintenant actif.</p>
          <Link to="/profil" className="inline-block bg-fb text-white font-semibold px-6 py-3 rounded-md">
            Voir mon profil
          </Link>
        </>
      )}

      {statut === 'en_attente' && (
        <>
          <Clock size={44} className="text-marigold mx-auto mb-3" />
          <h1 className="text-xl font-bold text-ink mb-1">Paiement en cours de traitement</h1>
          <p className="text-ink2 text-sm mb-6">
            Certains moyens de paiement (mobile money) prennent quelques minutes à se confirmer. Votre compte
            passera automatiquement en Premium dès validation — pas besoin de repayer.
          </p>
          <Link to="/profil" className="inline-block bg-fb text-white font-semibold px-6 py-3 rounded-md">
            Retour au profil
          </Link>
        </>
      )}

      {statut === 'echoue' && (
        <>
          <XCircle size={44} className="text-red mx-auto mb-3" />
          <h1 className="text-xl font-bold text-ink mb-1">Paiement non abouti</h1>
          <p className="text-ink2 text-sm mb-6">Le paiement a été annulé ou refusé. Vous pouvez réessayer.</p>
          <Link to="/premium" className="inline-block bg-fb text-white font-semibold px-6 py-3 rounded-md">
            Réessayer
          </Link>
        </>
      )}
    </div>
  )
}
