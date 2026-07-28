import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { countUnreadMessages } from './messages'

export function useUnreadMessages(userId) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) {
      setCount(0)
      return
    }

    let active = true
    const refresh = () => countUnreadMessages(userId).then((c) => active && setCount(c))
    refresh()

    // Se rafraîchit à chaque nouveau message inséré, en temps réel
    const channel = supabase
      .channel(`unread-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refresh)
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [userId])

  return count
}
