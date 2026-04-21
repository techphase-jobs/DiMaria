import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function KitchenLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // getSession() reads from cookie (no network call) — safe here because
  // middleware already validated the JWT via getUser() on this request.
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || !['kitchen', 'admin'].includes(profile.role)) redirect('/')

  return <>{children}</>
}
