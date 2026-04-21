'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChefHat } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        toast.error(error.message)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      // Race the profile fetch against a 10s timeout so the button never freezes
      const profileFetch = supabase.from('users').select('role').eq('id', user.id).single()
      const timeout = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 10000)
      )
      const { data: profile } = await Promise.race([profileFetch, timeout])

      if (profile?.role === 'admin') router.push('/admin')
      else if (profile?.role === 'kitchen') router.push('/kitchen')
      else router.push('/')
    } catch {
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChefHat className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('loginTitle')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('loginSubtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              id="email"
              label={t('email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <Input
              id="password"
              label={t('password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              {loading ? t('signingIn') : t('signIn')}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-brand-600 font-medium hover:underline">
            {t('signUp')}
          </Link>
        </p>
      </div>
    </div>
  )
}
