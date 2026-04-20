'use client'

import { useI18n } from '@/lib/i18n/context'

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n()

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
      <button
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 ${
          language === 'en'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('fr')}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 ${
          language === 'fr'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        FR
      </button>
    </div>
  )
}
