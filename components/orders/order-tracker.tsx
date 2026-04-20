'use client'

import { CheckCircle, Clock, ChefHat, Package, Bike, XCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { ORDER_STATUS_CONFIG, formatCurrency, formatDate } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'
import { OrderStatusBadge } from '@/components/ui/badge'

const STATUS_STEPS: OrderStatus[] = [
  'pending_payment',
  'payment_uploaded',
  'payment_confirmed',
  'preparing',
  'ready',
  'delivered',
]

const STEP_ICONS: Record<string, React.ElementType> = {
  pending_payment: Clock,
  payment_uploaded: Package,
  payment_confirmed: CheckCircle,
  preparing: ChefHat,
  ready: CheckCircle,
  out_for_delivery: Bike,
  delivered: CheckCircle,
}

interface OrderTrackerProps {
  order: Order
}

export function OrderTracker({ order }: OrderTrackerProps) {
  const { t, language } = useI18n()
  const currentStep = ORDER_STATUS_CONFIG[order.status]?.step ?? 0
  const isCancelled = order.status === 'cancelled'

  const steps =
    order.delivery_type === 'delivery'
      ? STATUS_STEPS.map((s) => (s === 'ready' ? 'out_for_delivery' : s)) as OrderStatus[]
      : STATUS_STEPS

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-100 text-xs font-medium uppercase tracking-wide">{t('orderNumber')}</p>
            <p className="text-xl font-bold mt-0.5">{order.order_number}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-brand-100 text-xs mt-2">{formatDate(order.created_at)}</p>
      </div>

      {/* Progress */}
      {!isCancelled && (
        <div className="px-5 py-5">
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute left-0 right-0 h-0.5 bg-gray-200 top-5 mx-6" />
            <div
              className="absolute left-0 h-0.5 bg-brand-500 top-5 mx-6 transition-all duration-500"
              style={{
                width: `${Math.min(((currentStep - 1) / (steps.length - 1)) * 100, 100)}%`,
              }}
            />

            {steps.map((stepStatus, idx) => {
              const stepNum = idx + 1
              const stepConfig = ORDER_STATUS_CONFIG[stepStatus]
              const done = stepConfig.step <= currentStep
              const active = stepConfig.step === currentStep
              const Icon = STEP_ICONS[stepStatus] || CheckCircle

              return (
                <div key={stepStatus} className="flex flex-col items-center gap-1.5 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      done
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-400'
                    } ${active ? 'ring-4 ring-brand-200 scale-110' : ''}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-xs font-medium text-center leading-tight max-w-[60px] ${done ? 'text-brand-700' : 'text-gray-400'}`}>
                    {language === 'fr' ? stepConfig.labelFr : stepConfig.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="flex items-center gap-3 px-5 py-4 bg-red-50">
          <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm font-medium">{t('cancelled')}</p>
        </div>
      )}

      {/* Order Details */}
      <div className="px-5 pb-5 space-y-4">
        {/* Items */}
        {order.order_items && order.order_items.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('orderItems')}</h4>
            <div className="space-y-2">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">{item.quantity}x</span> {item.menu_item_name}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.menu_item_price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between pt-1">
          <span className="font-semibold text-gray-900">{t('total')}</span>
          <span className="font-bold text-lg text-brand-600">{formatCurrency(order.total)}</span>
        </div>

        {/* Delivery info */}
        {order.delivery_address && (
          <p className="text-sm text-gray-500">
            📍 {order.delivery_address}
          </p>
        )}
      </div>
    </div>
  )
}
