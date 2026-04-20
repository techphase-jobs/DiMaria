'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations, TranslationKey } from './translations'
import type { Language } from '@/types'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey, vars?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    const stored = localStorage.getItem('dimaria_lang') as Language | null
    if (stored && (stored === 'en' || stored === 'fr')) {
      setLanguageState(stored)
      return
    }
    const browserLang = navigator.language.toLowerCase()
    if (browserLang.startsWith('fr')) {
      setLanguageState('fr')
    }
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('dimaria_lang', lang)
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string>): string => {
      let text = translations[language][key] as string
      if (!text) text = translations.en[key] as string
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, v)
        })
      }
      return text
    },
    [language]
  )

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
