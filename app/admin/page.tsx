'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, DollarSign, TrendingUp, Users, Download, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeOrders } from '@/hooks/use-realtime-orders'
import { useI18n } from '@/lib/i18n/context'
import { StatsCard } from '@/components/dashboard/stats-card'
import { OrderTable } from '@/components/dashboard/order-table'
import { Modal } from '@/components/ui/modal'
import { OrderTracker } from '@/components/orders/order-tracker'
import { Button } from '@/components/ui/button'
import { PageSpinner } from '@/components/ui/spinner'
import { formatCurrency, exportOrdersToCSV } from '@/lib/utils'
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns'
import type { Order } from '@/types'

export default function AdminPage() {
  const { t } = useI18n()
  const { orders, loading } = useRealtimeOrders('admin')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const now = new Date()
  const todayOrders = orders.filter((o) => new Date(o.created_at) >= startOfDay(now))
  const weekOrders = orders.filter((o) => new Date(o.created_at) >= startOfWeek(now))
  const monthOrders = orders.filter((o) => new Date(o.created_at) >= startOfMonth(now))

  const todayRevenue = todayOrders.reduce((s, o) => s + (o.payment_status === 'confirmed' ? o.total : 0), 0)
  const weekRevenue = weekOrders.reduce((s, o) => s + (o.payment_status === 'confirmed' ? o.total : 0), 0)
  const monthRevenue = monthOrders.reduce((s, o) => s + (o.payment_status === 'confirmed' ? o.total : 0), 0)

  const pendingCount = orders.filter((o) => ['pending_payment', 'payment_uploaded', 'payment_confirmed', 'preparing'].includes(o.status)).length

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === statusFilter)

  if (loading) return <PageSpinner />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('adminDashboard')}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportOrdersToCSV(orders)}
          >
            <Download className="h-4 w-4" />
            {t('exportCSV')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            {t('printOrders')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard label={t('todayRevenue')} value={formatCurrency(todayRevenue)} icon={DollarSign} />
        <StatsCard label={t('weekRevenue')} value={formatCurrency(weekRevenue)} icon={TrendingUp} />
        <StatsCard label={t('monthRevenue')} value={formatCurrency(monthRevenue)} icon={TrendingUp} />
        <StatsCard label={t('totalOrders')} value={orders.length} icon={ShoppingBag} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatsCard label={t('pendingOrders')} value={pendingCount} icon={ShoppingBag} />
        <StatsCard label="Today's Orders" value={todayOrders.length} icon={ShoppingBag} />
        <StatsCard label="This Month Orders" value={monthOrders.length} icon={Users} />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'pending_payment', 'payment_uploaded', 'payment_confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all capitalize ${
              statusFilter === s
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <OrderTable orders={filteredOrders} onView={setSelectedOrder} />
      </div>

      {selectedOrder && (
        <Modal
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order ${selectedOrder.order_number}`}
          size="lg"
        >
          <OrderTracker order={selectedOrder} />
        </Modal>
      )}
    </div>
  )
}
