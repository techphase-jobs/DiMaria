'use client'

import { use, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react'
import { useOrder } from '@/hooks/use-orders'
import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { OrderTracker } from '@/components/orders/order-tracker'
import { PageSpinner } from '@/components/ui/spinner'
import toast from 'react-hot-toast'

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t } = useI18n()
  const { order, loading } = useOrder(id)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !order) return

    setUploading(true)
    try {
      // Upload to storage
      const formData = new FormData()
      formData.append('file', file)
      formData.append('orderId', order.id)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) throw new Error('Upload failed')
      const { url } = await uploadRes.json()

      // Update order with screenshot URL
      const updateRes = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_screenshot_url: url }),
      })

      if (!updateRes.ok) throw new Error('Failed to update order')

      setUploaded(true)
      toast.success(t('screenshotUploaded'))
    } catch (err) {
      toast.error(t('uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <PageSpinner />
  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">{t('orderNotFound')}</p>
        <Link href="/orders" className="mt-4 inline-block text-brand-600 hover:underline">{t('back')}</Link>
      </div>
    )
  }

  const canUpload =
    !uploaded &&
    order.payment_status === 'pending' &&
    order.status === 'pending_payment'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('back')}
      </Link>

      <OrderTracker order={order} />

      {/* Screenshot upload section */}
      {(canUpload || order.status === 'pending_payment') && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1.5">{t('uploadScreenshot')}</h3>
          <p className="text-sm text-gray-500 mb-4">{t('uploadDesc')}</p>

          {uploaded || order.payment_status === 'uploaded' || order.payment_status === 'confirmed' ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{t('screenshotUploaded')}</span>
            </div>
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileRef.current?.click()}
                loading={uploading}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4" />
                {uploading ? t('loading') : t('uploadButton')}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Payment instructions reminder */}
      {order.status === 'pending_payment' && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-amber-800 text-sm whitespace-pre-line">{t('paymentDetails')}</p>
        </div>
      )}
    </div>
  )
}
