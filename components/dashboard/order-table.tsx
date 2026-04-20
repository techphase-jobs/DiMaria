'use client'

import { useState } from 'react'
import { Eye } from 'lucide-react'
import { OrderStatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Order } from '@/types'

interface OrderTableProps {
  orders: Order[]
  onView?: (order: Order) => void
}

export function OrderTable({ orders, onView }: OrderTableProps) {
  const [search, setSearch] = useState('')

  const filtered = orders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">No orders found</td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-brand-700">{order.order_number}</td>
                  <td className="px-4 py-3 text-gray-700">{order.customer_name || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 capitalize text-gray-600">{order.delivery_type}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3">
                    {onView && (
                      <button
                        onClick={() => onView(order)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand-600 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
