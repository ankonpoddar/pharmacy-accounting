import { useState, useCallback } from 'react'
import { Lock, Languages, Download, RefreshCw, AlertCircle, CheckCircle, Save } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { triggerManualBackup } from '../services/backup'

export default function SettingsPage() {
  const { t, lang, toggleLang } = useLanguage()
  const { pin, changePin, lock: lockApp } = useAuth()
  const { showToast } = useToast()

  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupResult, setBackupResult] = useState(null)

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

  return (
    <div className="space-y-6 pb-safe max-w-md mx-auto">
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
    </div>
  )
}