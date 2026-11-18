import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext()

const DEFAULT_PIN = '1234'
const PIN_KEY = 'pharmacy_pin'
const SESSION_KEY = 'pharmacy_session'

export function AuthProvider({ children }) {
  const [isLocked, setIsLocked] = useState(true)
  const [pin, setPin] = useState(() => localStorage.getItem(PIN_KEY) || DEFAULT_PIN)

  const checkSession = useCallback(() => {
    const session = sessionStorage.getItem(SESSION_KEY)
    if (session === 'unlocked') {
      setIsLocked(false)
    } else {
      setIsLocked(true)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

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

  return (
    <AuthContext.Provider value={{ isLocked, verifyPin, changePin, lock, pin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}