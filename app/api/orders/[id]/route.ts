import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { notifyStatusUpdate, notifyScreenshotUploaded } from '@/lib/whatsapp/client'
import type { OrderStatus } from '@/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, menu_items(*))')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = profile?.role

  const body = await request.json()
  const { status, payment_status, payment_screenshot_url } = body

  // Customers can only upload screenshots
  if (role === 'customer') {
    if (payment_screenshot_url) {
      const { data: order, error } = await supabase
        .from('orders')
        .update({
          payment_screenshot_url,
          payment_status: 'uploaded',
          status: 'payment_uploaded',
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      notifyScreenshotUploaded(order).catch(console.error)
      return NextResponse.json(order)
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Staff can update status
  if (role !== 'kitchen' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updateData: Record<string, string> = {}
  if (status) updateData.status = status
  if (payment_status) updateData.payment_status = payment_status

  // Auto-update payment status when confirming
  if (status === 'payment_confirmed') {
    updateData.payment_status = 'confirmed'
  }
  if (payment_status === 'rejected') {
    updateData.status = 'pending_payment'
  }

  const { data: order, error } = await serviceClient
    .from('orders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (status) {
    notifyStatusUpdate(order, status as OrderStatus).catch(console.error)
  }

  return NextResponse.json(order)
}
