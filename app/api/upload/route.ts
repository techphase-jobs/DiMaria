import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const orderId = formData.get('orderId') as string | null

  if (!file || !orderId) {
    return NextResponse.json({ error: 'Missing file or orderId' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${user.id}/${orderId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('payment-screenshots')
    .upload(path, file, { upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('payment-screenshots')
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
