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

export default function RegisterPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = t('requiredField')
    if (!form.email.trim()) e.email = t('requiredField')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('invalidEmail')
    if (!form.password) e.password = t('requiredField')
    if (form.password !== form.confirmPassword) e.confirmPassword = t('passwordMismatch')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        name: form.name.trim(),
        phone: form.phone || null,
        role: 'customer',
      })
      toast.success(t('success'))
      router.push('/')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChefHat className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('registerTitle')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('registerSubtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              id="name"
              label={t('name')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
              placeholder="John Doe"
              required
            />
            <Input
              id="email"
              label={t('email')}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              placeholder="you@example.com"
              required
            />
            <Input
              id="phone"
              label={`${t('phone')} (optional)`}
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0XX XXX XXXX"
            />
            <Input
              id="password"
              label={t('password')}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              placeholder="••••••••"
              required
            />
            <Input
              id="confirmPassword"
              label={t('confirmPassword')}
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              placeholder="••••••••"
              required
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              {loading ? t('registering') : t('signUp')}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          {t('hasAccount')}{' '}
          <Link href="/login" className="text-brand-600 font-medium hover:underline">
            {t('signIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
