import { useState, useEffect } from 'react'
import { Lock, Mail, User, Eye, EyeOff, Loader2, Chrome } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { signIn, signUp, signInWithGoogle, resetPassword } from '../services/auth'
import { useToast } from '../contexts/ToastContext'

export default function LoginPage() {
  const { t, lang } = useLanguage()
  const { firebaseUser, firebaseLoading } = useAuth()
  const { showToast } = useToast()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotPassword, setForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  // If already authenticated, redirect will happen in App
  useEffect(() => {
    if (firebaseUser && !firebaseLoading) {
      // Auth complete - App will handle redirect
    }
  }, [firebaseUser, firebaseLoading])

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        if (!email || !password) {
          setError('Please enter email and password')
          setLoading(false)
          return
        }
        if (!validateEmail(email)) {
          setError('Please enter a valid email')
          setLoading(false)
          return
        }
        await signIn(email, password)
        showToast('Welcome back!', 'success')
      } else {
        if (!displayName || !email || !password || !confirmPassword) {
          setError('Please fill all fields')
          setLoading(false)
          return
        }
        if (!validateEmail(email)) {
          setError('Please enter a valid email')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          setLoading(false)
          return
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }
        await signUp(email, password, displayName)
        showToast('Account created successfully!', 'success')
      }
    } catch (err) {
      let message = err.message
      if (err.code === 'auth/email-already-in-use') message = 'Email already registered'
      else if (err.code === 'auth/invalid-email') message = 'Invalid email address'
      else if (err.code === 'auth/user-not-found') message = 'No account found with this email'
      else if (err.code === 'auth/wrong-password') message = 'Incorrect password'
      else if (err.code === 'auth/weak-password') message = 'Password too weak (min 6 chars)'
      else if (err.code === 'auth/popup-closed-by-user') message = 'Sign-in cancelled'
      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      showToast('Signed in with Google!', 'success')
    } catch (err) {
      let message = err.message
      if (err.code === 'auth/popup-closed-by-user') message = 'Sign-in cancelled'
      else if (err.code === 'auth/cancelled-popup-request') message = 'Sign-in cancelled'
      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!resetEmail || !validateEmail(resetEmail)) {
      showToast('Enter a valid email', 'error')
      return
    }
    try {
      await resetPassword(resetEmail)
      showToast('Password reset email sent!', 'success')
      setForgotPassword(false)
      setResetEmail('')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setForgotPassword(false)
  }

  // Don't render if Firebase is still loading
  if (firebaseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-50 to-white">
        <Loader2 className="h-10 w-10 text-brand-600 animate-spin" />
      </div>
    )
  }

  // If already logged in, show loading (App will redirect)
  if (firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-50 to-white">
        <Loader2 className="h-10 w-10 text-brand-600 animate-spin" />
        <p className="mt-4 text-gray-600">Signing you in...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-brand-50 to-white">
      <div className="w-full max-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-600 mb-4">
            <Lock className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('appTitle')}</h1>
          <p className="text-gray-500 mt-1">{isLogin ? 'Sign in to continue' : 'Create your account'}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2 animate-fade-in">
            <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        {/* Forgot Password Modal */}
        {forgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-sm animate-slide-up">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset Password</h3>
              <p className="text-sm text-gray-500 mb-4">Enter your email to receive a password reset link</p>
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForgotPassword(false)}
                    className="flex-1 py-3 px-4 text-gray-700 font-medium rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 text-white font-medium rounded-xl bg-brand-600 hover:bg-brand-700 transition-colors"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Login/Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
          {!isLogin && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('language') === 'bn' ? 'আপনার নাম' : 'Display Name'}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              autoComplete="name"
              required
            />
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('language') === 'bn' ? 'ইমেইল' : 'Email'}
              className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              autoComplete="email"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('language') === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              className="w-full pl-10 pr-12 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {!isLogin && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('language') === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
                className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {isLogin && (
            <button
              type="button"
              onClick={() => setForgotPassword(true)}
              className="w-full text-right text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Forgot password?
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gradient-to-b from-brand-50 to-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <Chrome className="h-5 w-5" />
          <span>Continue with Google</span>
        </button>

        {/* Toggle Mode */}
        <p className="mt-6 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={toggleMode}
            className="ml-2 text-brand-600 hover:text-brand-700 font-medium"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

        <style jsx>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
          .animate-fade-in { animation: fadeIn 0.3s ease-out; }
          .animate-slide-up { animation: slideUp 0.2s ease-out; }
        `}</style>
      </div>
    </div>
  )
}