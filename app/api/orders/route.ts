import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { notifyOrderPlaced } from '@/lib/whatsapp/client'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { sanitize, sanitizePhone } from '@/lib/sanitize'
import type { CartItem } from '@/types'

export async function GET() {
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
  // Rate limit: 5 orders per minute per IP
  if (!rateLimit(getIp(request), { limit: 5, windowSec: 60 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  // Auth is optional — guests can order without an account
  const { data: { user } } = await supabase.auth.getUser()

  const body = await request.json()
  const { items, delivery_type, delivery_address, special_instructions, customer_name, customer_phone, whatsapp_number } = body

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'No items in order' }, { status: 400 })
  }
  if (items.length > 50) {
    return NextResponse.json({ error: 'Order too large' }, { status: 400 })
  }

  // Validate delivery type
  const safeDeliveryType = ['pickup', 'delivery'].includes(delivery_type) ? delivery_type : 'pickup'

  // Verify menu item prices from DB (prevent price tampering)
  const menuItemIds = items.map((i: CartItem) => i.menu_item.id).filter(Boolean)
  const { data: dbItems } = await supabase
    .from('menu_items')
    .select('id, price, available')
    .in('id', menuItemIds)

  if (!dbItems || dbItems.length !== menuItemIds.length) {
    return NextResponse.json({ error: 'Invalid menu items' }, { status: 400 })
  }

  const priceMap = Object.fromEntries(dbItems.map((i) => [i.id, i]))

  for (const item of items as CartItem[]) {
    const dbItem = priceMap[item.menu_item.id]
    if (!dbItem?.available) {
      return NextResponse.json({ error: `${item.menu_item.name} is not available` }, { status: 400 })
    }
  }

  // Compute total from server-side prices
  const total = (items as CartItem[]).reduce((sum, i) => {
    const serverPrice = priceMap[i.menu_item.id]?.price ?? i.menu_item.price
    return sum + serverPrice * Math.min(Math.max(1, i.quantity), 99)
  }, 0)

  // Generate order number from DB sequence
  const { data: seqData } = await serviceClient.rpc('generate_order_number')
  const order_number: string = seqData ?? `DM-${Date.now()}`

  const { data: order, error: orderError } = await serviceClient
    .from('orders')
    .insert({
      user_id: user?.id ?? null,
      status: 'pending_payment',
      total,
      order_number,
      delivery_type: safeDeliveryType,
      delivery_address: safeDeliveryType === 'delivery' ? sanitize(delivery_address) : null,
      special_instructions: sanitize(special_instructions) || null,
      customer_name: sanitize(customer_name) || null,
      customer_phone: sanitizePhone(customer_phone) || null,
      whatsapp_number: sanitizePhone(whatsapp_number) || null,
      payment_status: 'pending',
    })
    .select()
    .single()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

  const orderItems = (items as CartItem[]).map((i) => ({
    order_id: order.id,
    menu_item_id: i.menu_item.id,
    menu_item_name: sanitize(i.menu_item.name),
    menu_item_price: priceMap[i.menu_item.id]?.price ?? i.menu_item.price,
    quantity: Math.min(Math.max(1, i.quantity), 99),
  }))

  const { error: itemsError } = await serviceClient.from('order_items').insert(orderItems)
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  notifyOrderPlaced(order).catch(console.error)

  return NextResponse.json(order, { status: 201 })
}
