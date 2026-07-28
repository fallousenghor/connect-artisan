import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Feed from './pages/Feed'
import Search from './pages/Search'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import Admin from './pages/Admin'
import ArtisanProfile from './pages/ArtisanProfile'
import CreatePost from './pages/CreatePost'
import MyProfile from './pages/MyProfile'
import Messages from './pages/Messages'
import Conversation from './pages/Conversation'
import Premium from './pages/Premium'
import PremiumReturn from './pages/PremiumReturn'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Feed />} />
            <Route path="/recherche" element={<Search />} />
            <Route path="/connexion" element={<Login />} />
            <Route path="/inscription" element={<Register />} />
            <Route path="/reinitialiser" element={<ResetPassword />} />
            <Route path="/artisan/:id" element={<ArtisanProfile />} />
            <Route
              path="/publier"
              element={
                <ProtectedRoute requireArtisan>
                  <CreatePost />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profil"
              element={
                <ProtectedRoute>
                  <MyProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages/:id"
              element={
                <ProtectedRoute>
                  <Conversation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/premium"
              element={
                <ProtectedRoute requireArtisan>
                  <Premium />
                </ProtectedRoute>
              }
            />
            <Route
              path="/premium/retour"
              element={
                <ProtectedRoute requireArtisan>
                  <PremiumReturn />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Feed />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
