'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { OrderStatusBadge } from '@/components/ui/badge'
import { PageSpinner } from '@/components/ui/spinner'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Order } from '@/types'

export default function OrdersPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    })
  }, [router])

  if (loading) return <PageSpinner />

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">{t('orders')}</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-gray-500">No orders yet. Place your first order!</p>
          <Link href="/" className="mt-4 inline-block text-brand-600 font-medium hover:underline">
            Browse Menu →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-semibold text-brand-700">{order.order_number}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{formatDate(order.created_at)}</span>
                  <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
                </div>
                <div className="mt-1.5 text-xs text-gray-400 capitalize">
                  {order.delivery_type} · {(order.order_items as { id: string }[])?.length || 0} {t('items')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
