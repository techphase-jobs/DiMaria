/**
 * Supabase Edge Function: order-notifications
 *
 * Triggered via a Supabase Database Webhook on orders UPDATE.
 * Sends WhatsApp notifications when order status changes,
 * even when status is updated directly from the Supabase dashboard.
 *
 * Deploy:
 *   supabase functions deploy order-notifications
 *
 * Configure webhook in Supabase Dashboard:
 *   Database → Webhooks → Create webhook
 *   Table: orders | Events: UPDATE
 *   URL: https://<project>.supabase.co/functions/v1/order-notifications
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0'
const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
const API_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN')
const MARY_WHATSAPP = Deno.env.get('MARY_WHATSAPP') ?? '233533607247'

interface OrderRecord {
  id: string
  order_number: string
  status: string
  total: number
  customer_name: string | null
  whatsapp_number: string | null
  delivery_address: string | null
  delivery_type: string
  payment_status: string
}

interface WebhookPayload {
  type: 'UPDATE'
  table: string
  record: OrderRecord
  old_record: OrderRecord
}

async function sendWhatsApp(to: string, message: string): Promise<void> {
  if (!PHONE_NUMBER_ID || !API_TOKEN) return

  const clean = to.replace(/\D/g, '')
  const formatted = clean.startsWith('233') ? clean
    : clean.startsWith('0') ? '233' + clean.slice(1)
    : '233' + clean

  await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: formatted,
      type: 'text',
      text: { body: message },
    }),
  }).catch(console.error)
}

const STATUS_MESSAGES: Record<string, (o: OrderRecord) => string> = {
  payment_confirmed: (o) =>
    `✅ *Payment Confirmed!*\n\nOrder *${o.order_number}* — Payment verified!\nWe're now preparing your delicious food. 🍲`,
  preparing: (o) =>
    `👨‍🍳 *Order Being Prepared*\n\nOrder *${o.order_number}* is now being prepared!\nWe'll notify you when it's ready.`,
  ready: (o) =>
    `🎉 *Order Ready!*\n\nOrder *${o.order_number}* is ready for pickup!\nCome collect your food at DiMaria Chop Bar.`,
  out_for_delivery: (o) =>
    `🛵 *Out for Delivery*\n\nOrder *${o.order_number}* is on its way!\nPlease be available at: ${o.delivery_address ?? 'your location'}`,
  delivered: (o) =>
    `✅ *Order Delivered!*\n\nOrder *${o.order_number}* has been delivered!\nEnjoy your meal! Thank you for choosing DiMaria Chop Bar 🙏`,
  cancelled: (o) =>
    `❌ *Order Cancelled*\n\nOrder *${o.order_number}* has been cancelled.\nContact us if you have any questions.`,
}

const STAFF_MESSAGES: Record<string, (o: OrderRecord) => string> = {
  payment_uploaded: (o) =>
    `📸 *Payment Screenshot Uploaded*\n\nOrder: *${o.order_number}*\nCustomer: ${o.customer_name ?? 'Guest'}\nAmount: GHS ${o.total.toFixed(2)}\n\nPlease verify in the kitchen dashboard.`,
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload: WebhookPayload = await req.json()
    const { record: newRecord, old_record: oldRecord } = payload

    // Only act when status actually changed
    if (newRecord.status === oldRecord.status) {
      return new Response('No status change', { status: 200 })
    }

    const promises: Promise<void>[] = []

    // Notify customer
    if (newRecord.whatsapp_number) {
      const buildMsg = STATUS_MESSAGES[newRecord.status]
      if (buildMsg) {
        promises.push(sendWhatsApp(newRecord.whatsapp_number, buildMsg(newRecord)))
      }
    }

    // Notify Mary
    const buildStaffMsg = STAFF_MESSAGES[newRecord.status]
    if (buildStaffMsg) {
      promises.push(sendWhatsApp(MARY_WHATSAPP, buildStaffMsg(newRecord)))
    }

    await Promise.allSettled(promises)
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
