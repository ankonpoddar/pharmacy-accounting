import { useState, useEffect, useRef, useCallback } from 'react'
import { Lock, Key, Loader2 } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

export default function LockScreen({ onUnlock }) {
  const { t } = useLanguage()
  const { verifyPin } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleNumber = (num) => {
    if (pin.length < 4) {
      setPin(prev => prev + num)
      setError(false)
    }
  }

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1))
    setError(false)
  }

  const handleSubmit = () => {
    if (pin.length !== 4) {
      setError(true)
      setTimeout(() => setError(false), 500)
      return
    }

    if (verifyPin(pin)) {
      onUnlock()
    } else {
      setError(true)
      setPin('')
      setAttempts(prev => prev + 1)
      setTimeout(() => setError(false), 500)

      // Lockout after 5 failed attempts
      if (attempts >= 4) {
        setTimeout(() => {
          setAttempts(0)
        }, 30000)
      }
    }
  }

  // Prevent default on number keys to avoid mobile keyboard issues
  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handleNumber(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleBackspace()
      } else if (e.key === 'Enter') {
        handleSubmit()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pin, attempts])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-brand-50 to-white">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-600 mb-4">
            <Lock className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('appTitle')}</h1>
          <p className="text-gray-500 mt-1">{t('pinTitle')}</p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                i < pin.length
                  ? 'bg-brand-600 border-brand-600'
                  : 'bg-white border-gray-300'
              } ${error ? 'animate-shake border-red-500' : ''}`}
            >
              {i < pin.length && <Key className="h-6 w-6 text-white" />}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && attempts > 0 && (
          <p className="text-center text-red-500 text-sm mb-4 animate-fade-in">
            Incorrect PIN. Attempts: {attempts}/5
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumber(num)}
              className="aspect-square bg-white border border-gray-200 rounded-xl text-2xl font-medium text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            className="aspect-square bg-white border border-gray-200 rounded-xl text-2xl font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm flex items-center justify-center"
            aria-label="Backspace"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={() => handleNumber(0)}
            className="aspect-square bg-white border border-gray-200 rounded-xl text-2xl font-medium text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleSubmit}
            className="aspect-square bg-brand-600 border-none rounded-xl text-2xl font-medium text-white hover:bg-brand-700 active:bg-brand-800 transition-colors shadow-sm flex items-center justify-center"
            aria-label="Unlock"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </button>
        </div>

        {/* Biometric hint */}
        <p className="text-center text-xs text-gray-400 mt-6">
          {attempts >= 3 && 'Too many attempts. Wait 30 seconds.'}
        </p>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  )
}