import { useState, useCallback } from 'react'
import { Lock, Languages, Download, RefreshCw, AlertCircle, CheckCircle, Save, LogOut, User, Mail, Chrome } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { triggerManualBackup } from '../services/backup'
import { signOut, updateUserProfile, changePassword as firebaseChangePassword } from '../services/auth'

export default function SettingsPage() {
  const { t, lang, toggleLang } = useLanguage()
  const { pin, changePin, lock: lockApp, firebaseUser, logout } = useAuth()
  const { showToast } = useToast()

  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupResult, setBackupResult] = useState(null)
  const [showAccount, setShowAccount] = useState(false)
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [displayName, setDisplayName] = useState(firebaseUser?.displayName || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const handlePinChange = async (e) => {
    e.preventDefault()
    setPinError('')

    if (!/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be 4 digits')
      return
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match')
      return
    }
    if (newPin === pin) {
      setPinError('New PIN must be different from current')
      return
    }

    const success = changePin(newPin)
    if (success) {
      setNewPin('')
      setConfirmPin('')
      showToast(t('pinChanged'), 'success')
    }
  }

  const handleBackup = async () => {
    setBackupLoading(true)
    setBackupResult(null)

    const result = await triggerManualBackup()
    setBackupLoading(false)

    if (result.success) {
      setBackupResult({
        type: 'success',
        message: 'Backup completed and emailed!',
        details: result.summary
      })
      showToast('Backup completed successfully', 'success')
    } else {
      setBackupResult({
        type: 'error',
        message: 'Backup failed',
        details: result.error
      })
      showToast(`Backup failed: ${result.error}`, 'error')
    }
  }

  const handleLockNow = () => {
    lockApp()
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setAccountError('Display name cannot be empty')
      return
    }
    setAccountLoading(true)
    setAccountError('')
    try {
      await updateUserProfile({ displayName: displayName.trim() })
      showToast('Profile updated', 'success')
    } catch (err) {
      setAccountError(err.message)
      showToast(err.message, 'error')
    } finally {
      setAccountLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setAccountError('')
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setAccountError('Please fill all fields')
      return
    }
    if (newPassword.length < 6) {
      setAccountError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setAccountError('Passwords do not match')
      return
    }
    setAccountLoading(true)
    try {
      // Note: Firebase requires re-authentication for password change
      // This is a simplified version - in production you'd use reauthenticateWithCredential
      await firebaseChangePassword(newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      showToast('Password changed', 'success')
    } catch (err) {
      setAccountError(err.message)
      showToast(err.message, 'error')
    } finally {
      setAccountLoading(false)
    }
  }

  const handleSignOut = async () => {
    await logout()
  }

  return (
    <div className="space-y-6 pb-safe max-w-md mx-auto">
      {/* User Profile Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
            {firebaseUser?.photoURL ? (
              <img src={firebaseUser.photoURL} alt="" className="w-16 h-16 rounded-full" />
            ) : (
              <User className="h-8 w-8 text-brand-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {firebaseUser?.displayName || 'User'}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {firebaseUser?.email}
            </p>
            {firebaseUser?.providerData?.map((p) => (
              <span key={p.providerId} className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                {p.providerId === 'google.com' ? 'Google' : 'Email'}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowAccount(!showAccount)}
          className="mt-4 w-full py-2 text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center justify-center gap-2"
        >
          {showAccount ? <chevronUp /> : <chevronDown />}
          {showAccount ? 'Hide Account Settings' : 'Account Settings'}
        </button>
      </div>

      {/* Account Settings (collapsible) */}
      {showAccount && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-fade-in">
          {/* Display Name */}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Change Password */}
            <div className="pt-4 border-t border-gray-100">
              <h4 className="font-medium text-gray-900 mb-3">Change Password</h4>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current Password"
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password (min 6 chars)"
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {accountError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {accountError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={accountLoading || !currentPassword || !newPassword || !confirmNewPassword}
                  className="w-full py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {accountLoading ? 'Saving...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Sign Out */}
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={handleSignOut}
                className="w-full py-3 border border-red-300 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Language */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Languages className="h-5 w-5 text-brand-600" />
          {t('language')}
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => lang !== 'en' && toggleLang()}
            disabled={lang === 'en'}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              lang === 'en'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            English
          </button>
          <button
            onClick={() => lang !== 'bn' && toggleLang()}
            disabled={lang === 'bn'}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              lang === 'bn'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            বাংলা
          </button>
        </div>
      </div>

      {/* PIN Settings */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-brand-600" />
          Change PIN
        </h3>
        <form onSubmit={handlePinChange} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Current PIN</label>
            <input
              type="password"
              value={pin}
              readOnly
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl bg-gray-50 text-center letter-spacing-widest font-mono"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">New PIN (4 digits)</label>
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              maxLength={4}
              pattern="[0-9]*"
              inputMode="numeric"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-center letter-spacing-widest font-mono"
              placeholder="****"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Confirm New PIN</label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              maxLength={4}
              pattern="[0-9]*"
              inputMode="numeric"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-center letter-spacing-widest font-mono"
              placeholder="****"
            />
          </div>
          {pinError && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {pinError}
            </p>
          )}
          <button
            type="submit"
            disabled={!newPin || !confirmPin}
            className="w-full py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-5 w-5 inline mr-2" />
            Save PIN
          </button>
        </form>
      </div>

      {/* Backup */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-brand-600" />
          Backup & Email Report
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Generates CSV/JSON report of today's sales, dues, expenses. Uploads to Google Drive and emails summary to your Gmail.
        </p>
        <button
          onClick={handleBackup}
          disabled={backupLoading}
          className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
            backupLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-brand-600 text-white hover:bg-brand-700'
          }`}
        >
          {backupLoading ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              Backup & Email Report
            </>
          )}
        </button>

        {backupResult && (
          <div className={`mt-4 p-4 rounded-xl ${
            backupResult.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              {backupResult.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {backupResult.type === 'success' ? 'text-green-700' : 'text-red-700'}
              </span>
            </div>
            <p className="text-sm mt-2">{backupResult.message}</p>
            {backupResult.details && (
              <div className="mt-3 p-3 bg-white rounded-lg text-xs font-mono">
                {Object.entries(backupResult.details).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lock Now */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <button
          onClick={handleLockNow}
          className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <Lock className="h-5 w-5" />
          Lock App Now
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">Requires PIN on next open</p>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
        <p className="text-sm text-gray-500">Pharmacy Accounting v1.0</p>
        <p className="text-xs text-gray-400 mt-1">PWA + Android APK ready</p>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  )
}

// Inline chevron icons to avoid extra imports
function chevronUp() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
}
function chevronDown() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
}