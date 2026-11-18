import { useState, useEffect } from 'react'
import { LayoutDashboard, ShoppingBag, FileText, Receipt, Settings, Menu, X, LogOut, User } from 'lucide-react'
import { LanguageProvider } from './contexts/LanguageContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider, useToast } from './contexts/ToastContext'
import LockScreen from './components/LockScreen'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import { useLanguage } from './contexts/LanguageContext'

function AppContent() {
  const {
    isLocked,
    firebaseUser,
    firebaseLoading,
    logout,
    verifyPin
  } = useAuth()
  const { toasts, dismissToast } = useToast()
  const { t, lang } = useLanguage()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showDrawer, setShowDrawer] = useState(false)

  const tabs = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'sales', label: t('sales'), icon: ShoppingBag },
    { id: 'dues', label: t('dues'), icon: FileText },
    { id: 'expenses', label: t('expenses'), icon: Receipt },
    { id: 'settings', label: t('settings'), icon: Settings }
  ]

  // Show loading while Firebase auth initializes
  if (firebaseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 mb-4">
            <div className="h-8 w-8 text-white animate-spin border-4 border-white/30 border-t-white rounded-full" />
          </div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated with Firebase - show login page
  if (!firebaseUser) {
    return <LoginPage />
  }

  // Authenticated but PIN locked - show lock screen
  if (isLocked) {
    return <LockScreen onUnlock={() => {}} />
  }

  // Fully authenticated and unlocked - show main app
  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />
      case 'sales':
        return (
          <div className="pb-safe">
            <DashboardPage />
          </div>
        )
      case 'dues':
        return <DashboardPage />
      case 'expenses':
        return <DashboardPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <DashboardPage />
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 pt-safe">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDrawer(true)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="font-bold text-xl text-gray-900">{t('appTitle')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {}}
              className="px-3 py-1.5 text-sm font-medium rounded-xl bg-brand-100 text-brand-700"
            >
              {lang === 'en' ? 'EN' : 'বাংলা'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 py-4">
        {renderTab()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-40 max-w-xl mx-auto">
        <div className="grid grid-cols-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 flex flex-col items-center gap-1 transition-colors ${
                activeTab === tab.id
                  ? 'text-brand-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon className="h-6 w-6" />
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Side Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDrawer(false)}
          />
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setShowDrawer(false); }}
                  className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 rounded-xl flex items-center gap-3 text-left text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-24 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-in px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-green-600 text-white' :
              toast.type === 'error' ? 'bg-red-600 text-white' :
              'bg-gray-900 text-white'
            }`}
          >
            <span className="flex-1 text-sm">{toast.message}</span>
            <button onClick={() => dismissToast(toast.id)} className="text-white/70 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}