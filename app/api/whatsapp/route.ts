import { NextRequest, NextResponse } from 'next/server'

// WhatsApp Cloud API webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'dimaria-webhook-token'

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Receive inbound WhatsApp messages (future: handle customer replies)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Log inbound messages for debugging — extend to handle replies
    console.log('[WhatsApp Webhook]', JSON.stringify(body, null, 2))
    return NextResponse.json({ status: 'ok' })
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
