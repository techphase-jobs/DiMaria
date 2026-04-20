'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

export default function CartPage() {
  const { t } = useI18n()
  const { items, updateQuantity, removeItem, total } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="h-9 w-9 text-gray-300" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('cartEmpty')}</h2>
        <p className="text-gray-500 mb-6">{t('cartEmptyDesc')}</p>
        <Link href="/">
          <Button size="lg">{t('continueShopping')}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">{t('cartTitle')}</h1>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div
            key={item.menu_item.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4"
          >
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-orange-50 flex-shrink-0">
              {item.menu_item.image_url ? (
                <Image
                  src={item.menu_item.image_url}
                  alt={item.menu_item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-2xl">🍲</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{item.menu_item.name}</h3>
              <p className="text-brand-600 font-bold text-sm mt-0.5">
                {formatCurrency(item.menu_item.price)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-1">
                <button
                  onClick={() => updateQuantity(item.menu_item.id, item.quantity - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-brand-600"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.menu_item.id, item.quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-brand-600 text-white hover:bg-brand-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                onClick={() => removeItem(item.menu_item.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between mb-2 text-sm text-gray-500">
          <span>{t('subtotal')}</span>
          <span>{formatCurrency(total())}</span>
        </div>
        <div className="flex items-center justify-between font-bold text-gray-900 text-base border-t border-gray-50 pt-2">
          <span>{t('total')}</span>
          <span className="text-brand-600 text-lg">{formatCurrency(total())}</span>
        </div>
      </div>

      <Link href="/checkout">
        <Button size="lg" className="w-full">
          {t('checkout')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  )
}
