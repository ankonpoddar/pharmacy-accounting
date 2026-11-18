import { useState } from 'react'
import { Plus, CheckCircle2, Trash2, UserPlus } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { formatBDT } from '../utils/currency'
import { getTodayBD } from '../utils/date'

const DUE_CATEGORIES = ['Customer', 'Supplier', 'Other']

export default function DuesPage({ date, onUpdate }) {
  const { t } = useLanguage()
  const { data: dues, loading, add, remove } = useFirestoreCollection('dues', date)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Customer')

  const today = getTodayBD()
  const isTodayView = date === today

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!name.trim() || !amount) return
    await add({ date, name: name.trim(), amount: parseFloat(amount), category, paid: false })
    setName('')
    setAmount('')
    if (onUpdate) onUpdate()
  }

  const handleCollect = async (due) => {
    if (due.paid) return
    await add({ ...due, paid: true, collectedAt: new Date().toISOString() })
    if (onUpdate) onUpdate()
  }

  const handleDelete = async (id) => {
    await remove(id)
    if (onUpdate) onUpdate()
  }

  const activeDues = dues.filter(d => !d.paid)
  const collectedDues = dues.filter(d => d.paid)
  const totalDueGiven = activeDues.reduce((sum, d) => sum + (d.amount || 0), 0)
  const totalDueCollected = collectedDues.reduce((sum, d) => sum + (d.amount || 0), 0)

  return (
    <div className="space-y-6 pb-safe">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">{t('totalDueGiven')}</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatBDT(totalDueGiven)}</p>
          <p className="text-xs text-gray-400 mt-1">{activeDues.length} pending</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">{t('totalDueCollected')}</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatBDT(totalDueCollected)}</p>
          <p className="text-xs text-gray-400 mt-1">{collectedDues.length} collected</p>
        </div>
      </div>

      {/* Add Due Form */}
      {isTodayView && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-brand-600" />
            {t('addDue')}
          </h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Customer Name"
                className="px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {DUE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <input
                type="number"
                min="0"
                step="0.5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount (৳)"
                className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors"
              >
                {t('addDue')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Dues List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{t('dues')} - Active ({activeDues.length})</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : activeDues.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No pending dues</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {activeDues.map((due) => (
              <li key={due.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{due.name}</p>
                  <p className="text-sm text-gray-500">
                    <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 rounded-full">{due.category}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="font-semibold text-red-600">{formatBDT(due.amount)}</span>
                  <button
                    onClick={() => handleCollect(due)}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4 inline mr-1" />
                    {t('collectDue')}
                  </button>
                  <button
                    onClick={() => handleDelete(due.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Collected Dues */}
      {collectedDues.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Collected Today ({collectedDues.length})</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {collectedDues.map((due) => (
              <li key={due.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{due.name}</p>
                  <p className="text-sm text-green-600">Collected</p>
                </div>
                <span className="font-semibold text-green-600">{formatBDT(due.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}