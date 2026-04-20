'use client'

import { ChefHat } from 'lucide-react'
import { MenuGrid } from '@/components/menu/menu-grid'
import { useI18n } from '@/lib/i18n/context'

export default function HomePage() {
  const { t } = useI18n()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 sm:p-8 mb-6 text-white overflow-hidden relative">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
          <ChefHat className="h-32 w-32" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1.5">{t('appName')}</h1>
        <p className="text-brand-100 text-sm sm:text-base max-w-md">
          Authentic Ghanaian food, freshly prepared and delivered to your door.
        </p>
      </div>

      <MenuGrid />
    </div>
  )
}
