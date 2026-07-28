import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from './Loader'

export default function ProtectedRoute({ children, requireArtisan = false, requireAdmin = false }) {
  const { user, isArtisan, profile, loading } = useAuth()

  if (loading) return <Loader label="Vérification de la session…" />
  if (!user) return <Navigate to="/connexion" replace />
  if (requireArtisan && !isArtisan) return <Navigate to="/profil" replace />
  if (requireAdmin && profile?.role !== 'admin') return <Navigate to="/profil" replace />

  return children
}
