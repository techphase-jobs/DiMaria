'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { MenuItemCard } from './menu-item-card'
import { Spinner } from '@/components/ui/spinner'
import { MENU_CATEGORIES } from '@/lib/utils'
import type { MenuItem, MenuCategory } from '@/types'

const PAGE_SIZE = 12

export function MenuGrid() {
  const { t } = useI18n()
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [category, setCategory] = useState<MenuCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const fetchItems = useCallback(
    async (reset = false) => {
      const supabase = createClient()
      const currentPage = reset ? 0 : page

      if (reset) setLoading(true)
      else setLoadingMore(true)

      let query = supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)

      if (category !== 'all') query = query.eq('category', category)
      if (search.trim()) query = query.ilike('name', `%${search.trim()}%`)

      const { data } = await query

      if (reset) {
        setItems(data || [])
        setPage(1)
      } else {
        setItems((prev) => [...prev, ...(data || [])])
        setPage((p) => p + 1)
      }

      setHasMore((data?.length ?? 0) === PAGE_SIZE)
      setLoading(false)
      setLoadingMore(false)
    },
    [category, search, page]
  )

  useEffect(() => {
    fetchItems(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search])

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore) return
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchItems(false)
      }
    })
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [hasMore, loadingMore, fetchItems])

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        <button
          onClick={() => setCategory('all')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            category === 'all'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('allCategories')}
        </button>
        {MENU_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              category === cat
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-gray-500 font-medium">{t('noItemsFound')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {items.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
          <div ref={sentinelRef} className="h-4" />
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}
        </>
      )}
    </div>
  )
}
