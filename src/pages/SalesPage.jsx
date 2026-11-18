import { useState } from 'react'
import { Plus, Minus, Save, Trash2, X } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { parseQuickEntry, formatQuickEntryPreview } from '../utils/parseQuickEntry'
import { formatBDT } from '../utils/currency'
import { getTodayBD } from '../utils/date'
import { MedicineAutocomplete } from '../components/MedicineAutocomplete'
import { addCustomMedicine } from '../services/cache'

export default function SalesPage({ date, onQuickEntry }) {
  const { t } = useLanguage()
  const { data: sales, loading, add, remove } = useFirestoreCollection('sales', date)
  const [items, setItems] = useState([{ medicine: '', quantity: '', unit: 'pc', amount: '' }])
  const [quickEntry, setQuickEntry] = useState('')
  const [showQuickPreview, setShowQuickPreview] = useState(null)

  const today = getTodayBD()
  const isTodayView = date === today

  const handleQuickEntryChange = (e) => {
    const value = e.target.value
    setQuickEntry(value)
    const parsed = parseQuickEntry(value)
    setShowQuickPreview(parsed ? formatQuickEntryPreview(parsed) : null)
  }

  const handleQuickEntrySubmit = async (e) => {
    e.preventDefault()
    const parsed = parseQuickEntry(quickEntry)
    if (!parsed || !parsed.medicine) return

    const saleData = {
      date,
      medicine: parsed.medicine,
      quantity: parsed.quantity,
      unit: parsed.unit,
      pricePerUnit: parsed.pricePerUnit,
      totalAmount: parsed.totalAmount,
      source: 'quick'
    }

    await add(saleData)

    // Auto-save as custom medicine if not in database
    await addCustomMedicine({
      name: parsed.medicine,
      display: parsed.medicine,
      generic: '',
      strength: ''
    })

    setQuickEntry('')
    setShowQuickPreview(null)
    if (onQuickEntry) onQuickEntry()
  }

  const addItem = () => {
    setItems([...items, { medicine: '', quantity: '', unit: 'pc', amount: '' }])
  }

  const removeItem = (index) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSaveAll = async () => {
    for (const item of items) {
      if (!item.medicine || !item.amount) continue
      const qty = parseFloat(item.quantity) || 1
      const amount = parseFloat(item.amount) || 0
      const pricePerUnit = qty > 0 ? amount / qty : 0

      await add({
        date,
        medicine: item.medicine,
        quantity: qty,
        unit: item.unit,
        pricePerUnit,
        totalAmount: amount,
        source: 'manual'
      })

      await addCustomMedicine({
        name: item.medicine.toLowerCase(),
        display: item.medicine,
        generic: '',
        strength: ''
      })
    }
    setItems([{ medicine: '', quantity: '', unit: 'pc', amount: '' }])
  }

  const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)

  return (
    <div className="space-y-6 pb-safe">
      {/* Quick Entry Box */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Plus className="h-5 w-5 text-brand-600" />
          {t('quickEntry')}
        </h3>
        <form onSubmit={handleQuickEntrySubmit} className="space-y-3">
          <input
            type="text"
            value={quickEntry}
            onChange={handleQuickEntryChange}
            placeholder={t('quickEntry')}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            autoComplete="off"
          />
          {showQuickPreview && (
            <p className="text-sm text-brand-700 bg-brand-50 px-3 py-2 rounded-lg">
              → {showQuickPreview}
            </p>
          )}
          <button
            type="submit"
            disabled={!quickEntry.trim()}
            className="w-full py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('addSale')}
          </button>
        </form>
      </div>

      {/* Manual Multi-Item Entry */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">{t('addSale')} (Multiple)</h3>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start">
              <MedicineAutocomplete
                value={item.medicine}
                onChange={(v) => updateItem(idx, 'medicine', v)}
                placeholder={t('quickEntry').split(' ')[0]}
                className="flex-1"
              />
              <div className="flex gap-2 flex-1 sm:flex-none">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  placeholder="Qty"
                  className="w-20 px-3 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <select
                  value={item.unit}
                  onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                  className="w-24 px-3 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="pc">Pc</option>
                  <option value="box">Box</option>
                  <option value="strip">Strip</option>
                  <option value="bottle">Bottle</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={item.amount}
                  onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                  placeholder="Amount (৳)"
                  className="flex-1 px-3 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    aria-label="Remove"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {items.length < 5 && (
            <button type="button" onClick={addItem} className="w-full sm:w-auto py-2 text-brand-600 hover:bg-brand-50 rounded-xl font-medium transition-colors">
              + {t('addSale')}
            </button>
          )}
        </div>
        <button
          onClick={handleSaveAll}
          disabled={items.every(i => !i.medicine || !i.amount)}
          className="mt-4 w-full sm:w-auto py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          <Save className="h-5 w-5 inline mr-2" />
          Save All
        </button>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{t('sales')} ({sales.length})</h3>
          <span className="text-brand-700 font-bold">{formatBDT(totalSales)}</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : sales.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No sales for this date</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sales.map((sale) => (
              <li key={sale.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{sale.medicine}</p>
                  <p className="text-sm text-gray-500">
                    {sale.quantity} {sale.unit} × {formatBDT(sale.pricePerUnit)}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="font-semibold text-brand-700">{formatBDT(sale.totalAmount)}</span>
                  <button
                    onClick={() => remove(sale.id)}
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
    </div>
  )
}