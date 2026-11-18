import { useState } from 'react'
import { Plus, Trash2, Receipt } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { formatBDT } from '../utils/currency'
import { getTodayBD } from '../utils/date'

const EXPENSE_CATEGORIES = [
  'Company Payment',
  'Utility/Rent',
  'Snacks/Tea',
  'Transport',
  'Salary',
  'Misc'
]

export default function ExpensesPage({ date, onUpdate }) {
  const { t } = useLanguage()
  const { data: expenses, loading, add, remove } = useFirestoreCollection('expenses', date)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Misc')

  const today = getTodayBD()
  const isTodayView = date === today

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!description.trim() || !amount) return
    await add({ date, description: description.trim(), amount: parseFloat(amount), category })
    setDescription('')
    setAmount('')
    if (onUpdate) onUpdate()
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0)
    return acc
  }, {})

  return (
    <div className="space-y-6 pb-safe">
      {/* Total Expenses Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t('totalExpenses')}</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">{formatBDT(totalExpenses)}</p>
          </div>
          <div className="p-3 bg-orange-100 rounded-xl">
            <Receipt className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Add Expense Form */}
      {isTodayView && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-brand-600" />
            {t('addExpense')}
          </h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
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
                className="px-6 py-3 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 transition-colors"
              >
                {t('addExpense')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{t('expenses')} ({expenses.length})</h3>
          <span className="text-orange-600 font-bold">{formatBDT(totalExpenses)}</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No expenses for this date</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {expenses.map((exp) => (
              <li key={exp.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{exp.description || exp.category}</p>
                  <p className="text-sm text-gray-500">
                    <span className="inline-block px-2 py-0.5 text-xs bg-orange-50 text-orange-700 rounded-full">{exp.category}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="font-semibold text-orange-600">{formatBDT(exp.amount)}</span>
                  <button
                    onClick={() => remove(exp.id)}
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

      {/* Category Breakdown */}
      {Object.keys(expensesByCategory).length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">By Category</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(expensesByCategory).map(([cat, amt]) => (
              <div key={cat} className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">{cat}</p>
                <p className="font-semibold text-gray-900">{formatBDT(amt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}