import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [artisanProfile, setArtisanProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      setArtisanProfile(null)
      return
    }
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    setProfile(profileData ?? null)

    if (profileData?.role === 'artisan') {
      const { data: artisanData } = await supabase
        .from('artisans_profiles')
        .select('*, metiers(nom, icone)')
        .eq('id', userId)
        .maybeSingle()
      setArtisanProfile(artisanData ?? null)
    } else {
      setArtisanProfile(null)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      loadProfile(session?.user?.id).finally(() => setLoading(false))
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      loadProfile(session?.user?.id)
    })

    return () => listener.subscription.unsubscribe()
  }, [loadProfile])

  const refreshProfile = useCallback(() => loadProfile(session?.user?.id), [loadProfile, session])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    artisanProfile,
    loading,
    isArtisan: profile?.role === 'artisan',
    refreshProfile,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
