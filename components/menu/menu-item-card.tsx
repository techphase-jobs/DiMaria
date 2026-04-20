'use client'

import Image from 'next/image'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { useI18n } from '@/lib/i18n/context'
import { formatCurrency } from '@/lib/utils'
import type { MenuItem } from '@/types'
import toast from 'react-hot-toast'

interface MenuItemCardProps {
  item: MenuItem
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { t } = useI18n()
  const { items, addItem, updateQuantity, removeItem } = useCartStore()
  const cartItem = items.find((i) => i.menu_item.id === item.id)
  const quantity = cartItem?.quantity ?? 0

  function handleAdd() {
    addItem(item)
    toast.success(`${item.name} added to cart`, { icon: '🛒', duration: 1500 })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col">
      {/* Image */}
      <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl">🍲</span>
          </div>
        )}
        {!item.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">{t('outOfStock')}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 flex-1">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-brand-600 text-base">
            {formatCurrency(item.price)}
          </span>

          {item.available ? (
            quantity === 0 ? (
              <button
                onClick={handleAdd}
                className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                {t('addToCart')}
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-brand-50 rounded-lg p-1">
                <button
                  onClick={() => {
                    if (quantity === 1) removeItem(item.id)
                    else updateQuantity(item.id, quantity - 1)
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white shadow-sm text-brand-600 hover:bg-brand-100 transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="text-sm font-bold text-brand-700 w-4 text-center">{quantity}</span>
                <button
                  onClick={handleAdd}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          ) : (
            <span className="text-xs text-gray-400 font-medium">{t('outOfStock')}</span>
          )}
        </div>
      </div>
    </div>
  )
}
