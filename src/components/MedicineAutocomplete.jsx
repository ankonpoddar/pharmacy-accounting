import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { searchMedicines, addCustomMedicine } from '../services/cache'
import { useLanguage } from '../contexts/LanguageContext'

export function MedicineAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = '',
  disabled = false,
  className = ''
}) {
  const { t } = useLanguage()
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const debounceRef = useRef(null)

  const fetchSuggestions = useCallback(async (query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const results = await searchMedicines(query)
      setSuggestions(results)
      setIsOpen(results.length > 0)
      setHighlightedIndex(-1)
    }, 100)
  }, [])

  useEffect(() => {
    if (value && value.length >= 2) {
      fetchSuggestions(value)
    } else {
      setSuggestions([])
      setIsOpen(false)
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, fetchSuggestions])

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          selectSuggestion(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const selectSuggestion = (medicine) => {
    onChange(medicine.display)
    onSelect?.(medicine)
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 200)
  }

  const handleInputChange = (e) => {
    const newValue = e.target.value
    onChange(newValue)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 2 && setIsOpen(suggestions.length > 0)}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-100"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg ring-1 ring-black/5"
          role="listbox"
        >
          {suggestions.map((med, idx) => (
            <li
              key={med.name}
              role="option"
              aria-selected={idx === highlightedIndex}
              onClick={() => selectSuggestion(med)}
              onMouseEnter={() => setHighlightedIndex(idx)}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                idx === highlightedIndex ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50'
              } ${idx === suggestions.length - 1 ? '' : 'border-b border-gray-100'}`}
            >
              <div className="font-medium text-gray-900">{med.display}</div>
              {med.generic && med.generic !== med.display && (
                <div className="text-xs text-gray-500 mt-0.5">{med.generic}</div>
              )}
              {med.source === 'custom' && (
                <span className="inline-block ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
                  Custom
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {value && value.length >= 2 && !isOpen && suggestions.length === 0 && (
        <p className="mt-2 text-sm text-gray-500">
          {t('medicineNotFound') || 'Not in database. Will be saved as custom medicine.'}
        </p>
      )}
    </div>
  )
}