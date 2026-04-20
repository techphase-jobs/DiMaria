import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { OrderStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return `GHS ${amount.toFixed(2)}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `DM-${timestamp}${random}`
}

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; labelFr: string; color: string; bgColor: string; step: number }
> = {
  pending_payment: {
    label: 'Pending Payment',
    labelFr: 'Paiement en attente',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    step: 1,
  },
  payment_uploaded: {
    label: 'Payment Uploaded',
    labelFr: 'Paiement téléchargé',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    step: 2,
  },
  payment_confirmed: {
    label: 'Payment Confirmed',
    labelFr: 'Paiement confirmé',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    step: 3,
  },
  preparing: {
    label: 'Preparing',
    labelFr: 'En préparation',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    step: 4,
  },
  ready: {
    label: 'Ready for Pickup',
    labelFr: 'Prêt à retirer',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    step: 5,
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    labelFr: 'En livraison',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    step: 5,
  },
  delivered: {
    label: 'Delivered',
    labelFr: 'Livré',
    color: 'text-green-800',
    bgColor: 'bg-green-200',
    step: 6,
  },
  cancelled: {
    label: 'Cancelled',
    labelFr: 'Annulé',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    step: 0,
  },
}

export const MENU_CATEGORIES = [
  'Rice Dishes',
  'Swallow',
  'Soups',
  'Drinks',
  'Extras',
] as const

export function exportOrdersToCSV(orders: {
  order_number: string
  customer_name: string | null
  total: number
  status: string
  delivery_type: string
  created_at: string
}[]): void {
  const header = 'Order Number,Customer,Total (GHS),Status,Type,Date'
  const rows = orders.map((o) =>
    [
      o.order_number,
      o.customer_name || 'Guest',
      o.total.toFixed(2),
      o.status,
      o.delivery_type,
      formatDate(o.created_at),
    ].join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dimaria-orders-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
