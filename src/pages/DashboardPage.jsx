import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Download, RefreshCw } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { formatBDT } from '../utils/currency'
import { getTodayBD, formatDateDisplay, isToday } from '../utils/date'
import SalesPage from './SalesPage'
import DuesPage from './DuesPage'
import ExpensesPage from './ExpensesPage'

export default function DashboardPage() {
  const { t, lang } = useLanguage()
  const [selectedDate, setSelectedDate] = useState(getTodayBD())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const { data: sales, loading: salesLoading } = useFirestoreCollection('sales', selectedDate, refreshKey)
  const { data: dues, loading: duesLoading } = useFirestoreCollection('dues', selectedDate, refreshKey)
  const { data: expenses, loading: expensesLoading } = useFirestoreCollection('expenses', selectedDate, refreshKey)

  const loading = salesLoading || duesLoading || expensesLoading

  // Calculations
  const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
  const activeDues = dues.filter(d => !d.paid)
  const collectedDues = dues.filter(d => d.paid)
  const totalDueGiven = activeDues.reduce((sum, d) => sum + (d.amount || 0), 0)
  const totalDueCollected = collectedDues.reduce((sum, d) => sum + (d.amount || 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  const netCash = (totalSales + totalDueCollected) - totalExpenses

  const changeDate = (delta) => {
    const date = new Date(selectedDate + 'T00:00:00')
    date.setDate(date.getDate() + delta)
    const newDate = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' })
    setSelectedDate(newDate)
    setShowDatePicker(false)
  }

  const handleRefresh = () => {
    setRefreshKey(k => k + 1)
  }

  const stats = [
    { label: t('totalSales'), value: formatBDT(totalSales), color: 'bg-green-500', icon: '💰' },
    { label: t('totalDueGiven'), value: formatBDT(totalDueGiven), color: 'bg-red-500', icon: '📝' },
    { label: t('totalDueCollected'), value: formatBDT(totalDueCollected), color: 'bg-blue-500', icon: '✅' },
    { label: t('totalExpenses'), value: formatBDT(totalExpenses), color: 'bg-orange-500', icon: '🧾' }
  ]

  return (
    <div className="space-y-6 pb-safe">
      {/* Date Selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-left"
          >
            <div className="text-sm text-gray-500">{t('dashboard')}</div>
            <div className="font-semibold text-gray-900">{formatDateDisplay(selectedDate, lang)}</div>
          </button>
          <button
            onClick={() => changeDate(1)}
            disabled={isToday(selectedDate)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next day"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Net Cash Card */}
      <div className={`bg-gradient-to-r rounded-2xl p-5 shadow-lg ${netCash >= 0 ? 'from-green-600 to-green-700' : 'from-red-600 to-red-700'} text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">{t('netCash')}</p>
            <p className="text-3xl font-bold mt-1">{formatBDT(netCash)}</p>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            <span className="text-3xl">💵</span>
          </div>
        </div>
        <p className="text-xs opacity-70 mt-3">
          ({totalSales} + {formatBDT(totalDueCollected)}) - {formatBDT(totalExpenses)}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100" role="tablist">
          {[
            { id: 'sales', label: t('sales'), Component: SalesPage },
            { id: 'dues', label: t('dues'), Component: DuesPage },
            { id: 'expenses', label: t('expenses'), Component: ExpensesPage }
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={false}
              className="flex-1 py-3 px-4 text-center text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-4" role="tabpanel">
          <SalesPage date={selectedDate} onQuickEntry={handleRefresh} />
        </div>
        <div className="p-4 hidden" role="tabpanel">
          <DuesPage date={selectedDate} onUpdate={handleRefresh} />
        </div>
        <div className="p-4 hidden" role="tabpanel">
          <ExpensesPage date={selectedDate} onUpdate={handleRefresh} />
        </div>
      </div>
    </div>
  )
}