'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Bell, Eye, CheckCircle, XCircle, ChefHat, Truck } from 'lucide-react'
import { useRealtimeOrders } from '@/hooks/use-realtime-orders'
import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { PageSpinner } from '@/components/ui/spinner'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'
import toast from 'react-hot-toast'

type FilterType = 'all' | 'pending' | 'active' | 'done'

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Payment Pending' },
  { key: 'active', label: 'Active' },
  { key: 'done', label: 'Completed' },
]

function filterOrders(orders: Order[], filter: FilterType): Order[] {
  if (filter === 'pending') return orders.filter((o) => ['pending_payment', 'payment_uploaded'].includes(o.status))
  if (filter === 'active') return orders.filter((o) => ['payment_confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.status))
  if (filter === 'done') return orders.filter((o) => ['delivered', 'cancelled'].includes(o.status))
  return orders
}

export default function KitchenPage() {
  const { t } = useI18n()
  const { orders, loading, newOrderAlert } = useRealtimeOrders('kitchen')
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updating, setUpdating] = useState(false)

  async function updateOrderStatus(orderId: string, updates: Record<string, string>) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update order')
      toast.success('Order updated!')
      setSelectedOrder(null)
    } catch {
      toast.error('Failed to update order')
    } finally {
      setUpdating(false)
    }
  }

  const filtered = filterOrders(orders, filter)

  if (loading) return <PageSpinner />

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('kitchenDashboard')}</h1>
          <p className="text-gray-500 text-sm">Mary — 0533607247</p>
        </div>
        {newOrderAlert && (
          <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl animate-bounce">
            <Bell className="h-4 w-4" />
            <span className="text-sm font-semibold">New Order!</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Orders', value: orders.length, color: 'bg-gray-50' },
          { label: 'Pending Payment', value: orders.filter((o) => ['pending_payment', 'payment_uploaded'].includes(o.status)).length, color: 'bg-yellow-50' },
          { label: 'Active', value: orders.filter((o) => ['payment_confirmed', 'preparing', 'ready'].includes(o.status)).length, color: 'bg-green-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-2xl p-4 text-center`}>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f.key
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No orders found</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((order) => (
            <KitchenOrderCard
              key={order.id}
              order={order}
              onView={() => setSelectedOrder(order)}
              onConfirmPayment={() => updateOrderStatus(order.id, { status: 'payment_confirmed', payment_status: 'confirmed' })}
              onRejectPayment={() => updateOrderStatus(order.id, { payment_status: 'rejected', status: 'pending_payment' })}
              onMarkPreparing={() => updateOrderStatus(order.id, { status: 'preparing' })}
              onMarkReady={() => updateOrderStatus(order.id, { status: 'ready' })}
              onMarkDelivering={() => updateOrderStatus(order.id, { status: 'out_for_delivery' })}
              onMarkDelivered={() => updateOrderStatus(order.id, { status: 'delivered' })}
              updating={updating}
            />
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order ${selectedOrder.order_number}`}
          size="lg"
        >
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdate={(updates) => updateOrderStatus(selectedOrder.id, updates)}
            updating={updating}
          />
        </Modal>
      )}
    </div>
  )
}

function KitchenOrderCard({
  order, onView, onConfirmPayment, onRejectPayment,
  onMarkPreparing, onMarkReady, onMarkDelivering, onMarkDelivered, updating
}: {
  order: Order
  onView: () => void
  onConfirmPayment: () => void
  onRejectPayment: () => void
  onMarkPreparing: () => void
  onMarkReady: () => void
  onMarkDelivering: () => void
  onMarkDelivered: () => void
  updating: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-50">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono font-bold text-brand-700">{order.order_number}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-gray-600">{order.customer_name || 'Guest'}</p>
        <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
      </div>

      <div className="p-4">
        <div className="flex justify-between text-sm mb-3">
          <span className="text-gray-500 capitalize">{order.delivery_type}</span>
          <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={onView}>
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>

          {order.status === 'payment_uploaded' && (
            <>
              <Button size="sm" variant="primary" onClick={onConfirmPayment} loading={updating}>
                <CheckCircle className="h-3.5 w-3.5" />
                Confirm Pay
              </Button>
              <Button size="sm" variant="danger" onClick={onRejectPayment} loading={updating}>
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </Button>
            </>
          )}

          {order.status === 'payment_confirmed' && (
            <Button size="sm" onClick={onMarkPreparing} loading={updating}>
              <ChefHat className="h-3.5 w-3.5" />
              Start Prep
            </Button>
          )}

          {order.status === 'preparing' && (
            <Button size="sm" onClick={onMarkReady} loading={updating}>
              <CheckCircle className="h-3.5 w-3.5" />
              Mark Ready
            </Button>
          )}

          {order.status === 'ready' && order.delivery_type === 'delivery' && (
            <Button size="sm" onClick={onMarkDelivering} loading={updating}>
              <Truck className="h-3.5 w-3.5" />
              Out for Delivery
            </Button>
          )}

          {(order.status === 'ready' || order.status === 'out_for_delivery') && (
            <Button size="sm" onClick={onMarkDelivered} loading={updating}>
              <CheckCircle className="h-3.5 w-3.5" />
              Delivered
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function OrderDetailModal({
  order, onClose, onUpdate, updating
}: {
  order: Order
  onClose: () => void
  onUpdate: (updates: Record<string, string>) => void
  updating: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-gray-500">Customer:</span> <strong>{order.customer_name || '—'}</strong></div>
        <div><span className="text-gray-500">Phone:</span> <strong>{order.customer_phone || '—'}</strong></div>
        <div><span className="text-gray-500">Type:</span> <strong className="capitalize">{order.delivery_type}</strong></div>
        <div><span className="text-gray-500">Total:</span> <strong>{formatCurrency(order.total)}</strong></div>
      </div>

      {order.delivery_address && (
        <p className="text-sm"><span className="text-gray-500">Address:</span> {order.delivery_address}</p>
      )}

      {order.special_instructions && (
        <div className="bg-yellow-50 rounded-xl p-3">
          <p className="text-xs font-medium text-yellow-700 mb-1">Special Instructions:</p>
          <p className="text-sm text-yellow-800">{order.special_instructions}</p>
        </div>
      )}

      {/* Order Items */}
      {order.order_items && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Items:</h4>
          <div className="space-y-1.5">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}× {item.menu_item_name}</span>
                <span className="font-medium">{formatCurrency(item.menu_item_price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Screenshot */}
      {order.payment_screenshot_url && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment Screenshot:</h4>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={order.payment_screenshot_url}
              alt="Payment screenshot"
              fill
              className="object-contain"
            />
          </div>

          {order.payment_status === 'uploaded' && (
            <div className="flex gap-3 mt-3">
              <Button
                variant="primary"
                className="flex-1"
                loading={updating}
                onClick={() => onUpdate({ status: 'payment_confirmed', payment_status: 'confirmed' })}
              >
                <CheckCircle className="h-4 w-4" />
                Confirm Payment
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                loading={updating}
                onClick={() => onUpdate({ payment_status: 'rejected', status: 'pending_payment' })}
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
