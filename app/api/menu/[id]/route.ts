import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('menu_items')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
