'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, CheckCircle, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cart-store'
import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import type { DeliveryType } from '@/types'
import toast from 'react-hot-toast'

const PAYMENT_NUMBER = '0533607247'

export default function CheckoutPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { items, total, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    whatsapp_number: '',
    delivery_type: 'pickup' as DeliveryType,
    delivery_address: '',
    special_instructions: '',
  })

  // Pre-fill from user profile
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (data) {
        setForm((f) => ({
          ...f,
          customer_name: data.name || '',
          customer_phone: data.phone || '',
          whatsapp_number: data.phone || '',
        }))
      }
    })
  }, [])

  async function handleCopyNumber() {
    await navigator.clipboard.writeText(PAYMENT_NUMBER)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }
    if (!form.customer_name.trim()) {
      toast.error(t('requiredField'))
      return
    }
    if (form.delivery_type === 'delivery' && !form.delivery_address.trim()) {
      toast.error(t('deliveryAddressPlaceholder'))
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, ...form }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to place order')
      }

      const order = await res.json()
      clearCart()
      toast.success(t('orderPlaced'))
      router.push(`/orders/${order.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('orderFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (items.length === 0) router.push('/cart')
  }, [items.length, router])

  if (items.length === 0) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('checkoutTitle')}</h1>

      <form onSubmit={handlePlaceOrder} className="space-y-4">
        {/* Contact Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Contact Information</h2>
          <Input
            id="customer_name"
            label={t('yourName')}
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            placeholder="John Doe"
            required
          />
          <Input
            id="customer_phone"
            label={t('yourPhone')}
            type="tel"
            value={form.customer_phone}
            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
            placeholder="0XX XXX XXXX"
          />
          <Input
            id="whatsapp_number"
            label={t('whatsappNumber')}
            type="tel"
            value={form.whatsapp_number}
            onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
            placeholder="0XX XXX XXXX"
          />
        </div>

        {/* Delivery Type */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('deliveryType')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['pickup', 'delivery'] as DeliveryType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, delivery_type: type })}
                className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.delivery_type === type
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {type === 'pickup' ? '🏪 ' : '🛵 '}{t(type)}
              </button>
            ))}
          </div>
          {form.delivery_type === 'delivery' && (
            <Textarea
              id="delivery_address"
              label={t('deliveryAddress')}
              value={form.delivery_address}
              onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
              placeholder={t('deliveryAddressPlaceholder')}
              required
            />
          )}
        </div>

        {/* Special Instructions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <Textarea
            id="special_instructions"
            label={t('specialInstructions')}
            value={form.special_instructions}
            onChange={(e) => setForm({ ...form, special_instructions: e.target.value })}
            placeholder={t('specialInstructionsPlaceholder')}
          />
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">{t('orderSummary')}</h2>
          <div className="space-y-2 mb-3">
            {items.map((item) => (
              <div key={item.menu_item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.quantity}× {item.menu_item.name}</span>
                <span className="font-medium">{formatCurrency(item.menu_item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
            <span>{t('total')}</span>
            <span className="text-brand-600">{formatCurrency(total())}</span>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <ShoppingBag className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-2">{t('paymentInstructions')}</h3>
              <p className="text-amber-800 text-sm whitespace-pre-line">{t('paymentDetails')}</p>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="mt-3 flex items-center gap-1.5 text-amber-700 hover:text-amber-900 text-sm font-medium"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? t('copied') : `Copy number: ${PAYMENT_NUMBER}`}
              </button>
            </div>
          </div>
        </div>

        <Button type="submit" loading={loading} size="lg" className="w-full">
          {loading ? t('loading') : t('placeOrder')}
        </Button>
      </form>
    </div>
  )
}
