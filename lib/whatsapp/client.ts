import type { Order, OrderStatus } from '@/types'

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0'
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const API_TOKEN = process.env.WHATSAPP_API_TOKEN
const MARY_WHATSAPP = process.env.MARY_WHATSAPP || '233533607247'

async function sendMessage(to: string, message: string): Promise<boolean> {
  if (!PHONE_NUMBER_ID || !API_TOKEN) {
    console.warn('[WhatsApp] Missing credentials, skipping notification')
    return false
  }

  const cleanNumber = to.replace(/\D/g, '')
  const formattedNumber = cleanNumber.startsWith('233')
    ? cleanNumber
    : cleanNumber.startsWith('0')
    ? '233' + cleanNumber.slice(1)
    : '233' + cleanNumber

  try {
    const res = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedNumber,
        type: 'text',
        text: { body: message },
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[WhatsApp] Error:', err)
      return false
    }
    return true
  } catch (err) {
    console.error('[WhatsApp] Request failed:', err)
    return false
  }
}

export async function notifyOrderPlaced(order: Order): Promise<void> {
  const customerMsg = `🍽️ *DiMaria Chop Bar*\n\nYour order *${order.order_number}* has been placed!\n\n💳 *Payment Instructions:*\nSend GHS ${order.total.toFixed(2)} to:\n*Mary - 0533607247*\n\nAfter payment, upload your screenshot in the app.\nFood preparation starts after payment confirmation.\n\nTrack your order in the app. Thank you! 🙏`

  const staffMsg = `🔔 *New Order Alert!*\n\nOrder: *${order.order_number}*\nCustomer: ${order.customer_name || 'Guest'}\nTotal: GHS ${order.total.toFixed(2)}\nType: ${order.delivery_type}\n\nCheck the kitchen dashboard for details.`

  const promises: Promise<boolean>[] = []

  if (order.whatsapp_number) {
    promises.push(sendMessage(order.whatsapp_number, customerMsg))
  }
  promises.push(sendMessage(MARY_WHATSAPP, staffMsg))

  await Promise.allSettled(promises)
}

export async function notifyScreenshotUploaded(order: Order): Promise<void> {
  const staffMsg = `📸 *Payment Screenshot Uploaded*\n\nOrder: *${order.order_number}*\nCustomer: ${order.customer_name || 'Guest'}\nAmount: GHS ${order.total.toFixed(2)}\n\nPlease verify and confirm payment in the kitchen dashboard.`

  await sendMessage(MARY_WHATSAPP, staffMsg)
}

export async function notifyStatusUpdate(order: Order, status: OrderStatus): Promise<void> {
  if (!order.whatsapp_number) return

  const messages: Record<OrderStatus, string> = {
    pending_payment: '',
    payment_uploaded: '',
    payment_confirmed: `✅ *Payment Confirmed!*\n\nOrder *${order.order_number}* - Payment verified!\nWe're now preparing your delicious food. 🍲`,
    preparing: `👨‍🍳 *Order Being Prepared*\n\nOrder *${order.order_number}* is now being prepared!\nWe'll notify you when it's ready.`,
    ready: `🎉 *Order Ready!*\n\nOrder *${order.order_number}* is ready for pickup!\nCome collect your food at DiMaria Chop Bar.`,
    out_for_delivery: `🛵 *Out for Delivery*\n\nOrder *${order.order_number}* is on its way to you!\nPlease be available at: ${order.delivery_address || 'your location'}`,
    delivered: `✅ *Order Delivered!*\n\nOrder *${order.order_number}* has been delivered!\nEnjoy your meal! Thank you for choosing DiMaria Chop Bar 🙏`,
    cancelled: `❌ *Order Cancelled*\n\nOrder *${order.order_number}* has been cancelled.\nContact us if you have any questions.`,
  }

  const msg = messages[status]
  if (!msg) return

  await sendMessage(order.whatsapp_number, msg)
}
