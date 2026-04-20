'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart, User, LogOut, Menu as MenuIcon, X, ChefHat } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { useCartStore } from '@/store/cart-store'
import { LanguageSwitcher } from './language-switcher'
import type { User as UserType } from '@/types'
import { cn } from '@/lib/utils'

export function Navbar() {
  const { t } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const itemCount = useCartStore((s) => s.itemCount())

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
      if (data) setUser(data)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') { setUser(null); return }
        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (data) setUser(data)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const isStaff = user?.role === 'kitchen' || user?.role === 'admin'

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 hidden sm:block">
              {t('appName')}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {!isStaff && (
              <>
                <Link
                  href="/"
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === '/' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {t('menu')}
                </Link>
                <Link
                  href="/track"
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === '/track' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {t('trackOrder')}
                </Link>
                {user && (
                  <Link
                    href="/orders"
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      pathname === '/orders' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {t('orders')}
                  </Link>
                )}
              </>
            )}
            {user?.role === 'kitchen' && (
              <Link href="/kitchen" className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith('/kitchen') ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
              )}>
                {t('kitchen')}
              </Link>
            )}
            {user?.role === 'admin' && (
              <>
                <Link href="/admin" className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === '/admin' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                )}>
                  {t('dashboard')}
                </Link>
                <Link href="/admin/menu" className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === '/admin/menu' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                )}>
                  {t('manageMenu')}
                </Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            {!isStaff && (
              <Link
                href="/cart"
                className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-700"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-1">
                <span className="hidden sm:block text-sm text-gray-600 px-2">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-red-600"
                  title={t('logout')}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
              >
                <User className="h-4 w-4" />
                {t('login')}
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {!isStaff && (
            <>
              <Link href="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t('menu')}</Link>
              <Link href="/track" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t('trackOrder')}</Link>
              {user && <Link href="/orders" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t('orders')}</Link>}
            </>
          )}
          {user?.role === 'kitchen' && <Link href="/kitchen" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t('kitchen')}</Link>}
          {user?.role === 'admin' && (
            <>
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t('dashboard')}</Link>
              <Link href="/admin/menu" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t('manageMenu')}</Link>
            </>
          )}
          {!user && (
            <Link href="/register" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t('register')}</Link>
          )}
        </div>
      )}
    </nav>
  )
}
