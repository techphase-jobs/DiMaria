'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/types'

export function useOrders(userId?: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('orders')
        .select(`*, order_items(*, menu_items(*))`)
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error: err } = await query
      if (err) throw err
      setOrders(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return { orders, loading, error, refetch: fetchOrders }
}

export function useOrder(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function fetchOrder() {
      const { data, error: err } = await supabase
        .from('orders')
        .select(`*, order_items(*, menu_items(*))`)
        .eq('id', orderId)
        .single()

      if (err) {
        setError(err.message)
      } else {
        setOrder(data)
      }
      setLoading(false)
    }

    fetchOrder()

    // Real-time subscription
    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev) =>
            prev ? { ...prev, ...(payload.new as Order) } : null
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  return { order, loading, error }
}
