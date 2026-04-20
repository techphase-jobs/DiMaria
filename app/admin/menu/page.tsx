'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { MenuItemForm } from '@/components/admin/menu-item-form'
import { OrderStatusBadge } from '@/components/ui/badge'
import { PageSpinner } from '@/components/ui/spinner'
import { formatCurrency } from '@/lib/utils'
import { MENU_CATEGORIES } from '@/lib/utils'
import type { MenuItem, MenuCategory } from '@/types'
import toast from 'react-hot-toast'

export default function AdminMenuPage() {
  const { t } = useI18n()
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<MenuCategory | 'all'>('all')

  const fetchItems = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .order('sort_order', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  async function handleDelete(item: MenuItem) {
    if (!confirm(t('confirmDelete'))) return
    const supabase = createClient()
    const { error } = await supabase.from('menu_items').delete().eq('id', item.id)
    if (error) {
      toast.error('Failed to delete item')
      return
    }
    toast.success('Item deleted')
    fetchItems()
  }

  async function handleToggleAvailable(item: MenuItem) {
    const supabase = createClient()
    await supabase
      .from('menu_items')
      .update({ available: !item.available })
      .eq('id', item.id)
    fetchItems()
  }

  const filtered = categoryFilter === 'all'
    ? items
    : items.filter((i) => i.category === categoryFilter)

  if (loading) return <PageSpinner />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">{t('manageMenu')}</h1>
        <Button onClick={() => { setEditingItem(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4" />
          {t('addItem')}
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            categoryFilter === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          All ({items.length})
        </button>
        {MENU_CATEGORIES.map((cat) => {
          const count = items.filter((i) => i.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                categoryFilter === cat ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Item</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Order</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No items found</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${!item.available ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-orange-50 flex-shrink-0">
                          {item.image_url ? (
                            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-lg">🍲</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.category}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-600">{formatCurrency(item.price)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleAvailable(item)}
                        className="flex items-center gap-1.5 text-xs font-medium"
                      >
                        {item.available ? (
                          <><ToggleRight className="h-4 w-4 text-green-500" /><span className="text-green-600">Available</span></>
                        ) : (
                          <><ToggleLeft className="h-4 w-4 text-gray-400" /><span className="text-gray-400">Hidden</span></>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.sort_order}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingItem(item); setFormOpen(true) }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingItem(null) }}
        title={editingItem ? t('editItem') : t('addItem')}
        size="md"
      >
        <MenuItemForm
          item={editingItem}
          onSaved={() => { setFormOpen(false); setEditingItem(null); fetchItems() }}
          onCancel={() => { setFormOpen(false); setEditingItem(null) }}
        />
      </Modal>
    </div>
  )
}
