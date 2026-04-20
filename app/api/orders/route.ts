import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { notifyOrderPlaced } from '@/lib/whatsapp/client'
import type { CartItem } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = profile?.role

  let query = supabase
    .from('orders')
    .select('*, order_items(*, menu_items(*))')
    .order('created_at', { ascending: false })

  if (role === 'customer') {
    query = query.eq('user_id', user.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { items, delivery_type, delivery_address, special_instructions, customer_name, customer_phone, whatsapp_number } = body

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items in order' }, { status: 400 })
  }

  const total = (items as CartItem[]).reduce(
    (sum, i) => sum + i.menu_item.price * i.quantity,
    0
  )

  // Generate order number from DB sequence for uniqueness guarantees
  const { data: seqData } = await serviceClient.rpc('generate_order_number')
  const order_number: string = seqData ?? `DM-${Date.now()}`

  const { data: order, error: orderError } = await serviceClient
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'pending_payment',
      total,
      order_number,
      delivery_type: delivery_type || 'pickup',
      delivery_address: delivery_address || null,
      special_instructions: special_instructions || null,
      customer_name: customer_name || null,
      customer_phone: customer_phone || null,
      whatsapp_number: whatsapp_number || null,
      payment_status: 'pending',
    })
    .select()
    .single()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

  // Insert order items
  const orderItems = (items as CartItem[]).map((i) => ({
    order_id: order.id,
    menu_item_id: i.menu_item.id,
    menu_item_name: i.menu_item.name,
    menu_item_price: i.menu_item.price,
    quantity: i.quantity,
  }))

  const { error: itemsError } = await serviceClient.from('order_items').insert(orderItems)
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  // Send WhatsApp notification (non-blocking)
  notifyOrderPlaced(order).catch(console.error)

  return NextResponse.json(order, { status: 201 })
}
