'use client'

import { onAuthStateChanged, type User } from 'firebase/auth'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { firebaseAuth } from '@/lib/firebase'

type AuthContextValue = { user: User | null; loading: boolean }
const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

export function FirebaseSession({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false)
      return
    }

    try {
      return onAuthStateChanged(firebaseAuth, (nextUser) => {
        setUser(nextUser)
        setLoading(false)
      }, () => {
        setUser(null)
        setLoading(false)
      })
    } catch {
      setUser(null)
      setLoading(false)
      return
    }
  }, [])
  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export function useFirebaseSession() { return useContext(AuthContext) }
