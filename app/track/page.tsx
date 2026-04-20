'use client'

import { useState } from 'react'
import { Search, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OrderTracker } from '@/components/orders/order-tracker'
import type { Order } from '@/types'

export default function TrackPage() {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim().toUpperCase()
    if (!trimmed) return

    setLoading(true)
    setNotFound(false)
    setOrder(null)

    const supabase = createClient()
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', trimmed)
      .single()

    if (!data) {
      setNotFound(true)
    } else {
      setOrder(data)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('trackOrder')}</h1>
        <p className="text-gray-500 text-sm">
          Enter your order number to see the current status
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="flex-1">
          <Input
            placeholder="e.g. DM-1001"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            className="font-mono uppercase"
          />
        </div>
        <Button type="submit" loading={loading}>
          <Search className="h-4 w-4" />
          Track
        </Button>
      </form>

      {notFound && (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-600 font-medium">{t('orderNotFound')}</p>
          <p className="text-gray-400 text-sm mt-1">
            Check the order number in your WhatsApp notification
          </p>
        </div>
      )}

      {order && <OrderTracker order={order} />}
    </div>
  )
}
