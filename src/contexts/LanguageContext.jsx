import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations } from '../data/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('pharmacy_lang')
    return saved || 'en'
  })

  useEffect(() => {
    localStorage.setItem('pharmacy_lang', lang)
    document.body.dataset.lang = lang
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations.en[key] || key
  }, [lang])

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'bn' : 'en'))
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}