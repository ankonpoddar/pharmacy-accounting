import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { onAuthStateChange, signOut as firebaseSignOut, getCurrentUser } from '../services/auth'

const AuthContext = createContext()

const DEFAULT_PIN = '1234'
const PIN_KEY = 'pharmacy_pin'
const SESSION_KEY = 'pharmacy_session'

export function AuthProvider({ children }) {
  const [isLocked, setIsLocked] = useState(true)
  const [pin, setPin] = useState(() => localStorage.getItem(PIN_KEY) || DEFAULT_PIN)
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [firebaseLoading, setFirebaseLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setFirebaseUser(user)
      setFirebaseLoading(false)
      if (!user) {
        // User signed out - lock the app
        sessionStorage.removeItem(SESSION_KEY)
        setIsLocked(true)
      }
    })
    return () => unsubscribe()
  }, [])

  // PIN session check (only after Firebase auth is ready)
  const checkPinSession = useCallback(() => {
    if (firebaseLoading) return
    if (!firebaseUser) {
      setIsLocked(true)
      return
    }
    const session = sessionStorage.getItem(SESSION_KEY)
    if (session === 'unlocked') {
      setIsLocked(false)
    } else {
      setIsLocked(true)
    }
  }, [firebaseUser, firebaseLoading])

  useEffect(() => {
    checkPinSession()
  }, [checkPinSession])

  const verifyPin = useCallback((input) => {
    if (input === pin) {
      sessionStorage.setItem(SESSION_KEY, 'unlocked')
      setIsLocked(false)
      return true
    }
    return false
  }, [pin])

  const changePin = useCallback((newPin) => {
    if (/^\d{4}$/.test(newPin)) {
      setPin(newPin)
      localStorage.setItem(PIN_KEY, newPin)
      return true
    }
    return false
  }, [])

  const lock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setIsLocked(true)
  }, [])

  const logout = useCallback(async () => {
    await firebaseSignOut()
    // Firebase auth listener will handle locking
  }, [])

  return (
    <AuthContext.Provider value={{
      isLocked,
      firebaseUser,
      firebaseLoading,
      authError,
      verifyPin,
      changePin,
      lock,
      logout,
      pin
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}