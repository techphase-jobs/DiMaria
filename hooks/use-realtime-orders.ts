'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/types'

export function useRealtimeOrders(role: 'kitchen' | 'admin') {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [newOrderAlert, setNewOrderAlert] = useState(false)

  const fetchOrders = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('orders')
      .select(`*, order_items(*, menu_items(*))`)
      .order('created_at', { ascending: false })
      .limit(100)
    setOrders(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    const supabase = createClient()

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          // Fetch full order with items
          const { data } = await supabase
            .from('orders')
            .select(`*, order_items(*, menu_items(*))`)
            .eq('id', (payload.new as Order).id)
            .single()
          if (data) {
            setOrders((prev) => [data, ...prev])
            setNewOrderAlert(true)
            setTimeout(() => setNewOrderAlert(false), 5000)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === (payload.new as Order).id
                ? { ...o, ...(payload.new as Order) }
                : o
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchOrders])

  return { orders, loading, newOrderAlert, refetch: fetchOrders }
}
