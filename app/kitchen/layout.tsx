import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function KitchenLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['kitchen', 'admin'].includes(profile.role)) {
    redirect('/')
  }

  return <>{children}</>
}
