'use client'

import { useState, useRef } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { MENU_CATEGORIES } from '@/lib/utils'
import type { MenuItem, MenuCategory } from '@/types'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface MenuItemFormProps {
  item?: MenuItem | null
  onSaved: () => void
  onCancel: () => void
}

export function MenuItemForm({ item, onSaved, onCancel }: MenuItemFormProps) {
  const { t } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url || null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price?.toString() || '',
    category: item?.category || ('Rice Dishes' as MenuCategory),
    available: item?.available ?? true,
    sort_order: item?.sort_order?.toString() || '0',
  })

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.price) {
      toast.error('Name and price are required')
      return
    }

    setSaving(true)
    const supabase = createClient()

    try {
      let image_url = item?.image_url || null

      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('menu-images')
          .upload(path, imageFile, { upsert: true })
        if (uploadErr) throw uploadErr
        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(path)
        image_url = publicUrl
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        category: form.category,
        available: form.available,
        sort_order: parseInt(form.sort_order) || 0,
        image_url,
      }

      if (item) {
        const { error } = await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', item.id)
        if (error) throw error
        toast.success('Item updated!')
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert(payload)
        if (error) throw error
        toast.success('Item added!')
      }

      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Food Image</label>
        <div
          onClick={() => fileRef.current?.click()}
          className="relative border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-brand-400 transition-colors aspect-video bg-gray-50 flex items-center justify-center"
        >
          {imagePreview ? (
            <>
              <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null) }}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md text-gray-600 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="text-center">
              <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Click to upload image</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
      </div>

      <Input
        label={t('itemName')}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />

      <Textarea
        label={t('description')}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={2}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('price')}
          type="number"
          step="0.01"
          min="0"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <Input
          label="Sort Order"
          type="number"
          min="0"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('category')}</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as MenuCategory })}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
        >
          {MENU_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <div
          onClick={() => setForm({ ...form, available: !form.available })}
          className={`relative w-11 h-6 rounded-full transition-colors ${form.available ? 'bg-brand-600' : 'bg-gray-300'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.available ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-sm font-medium text-gray-700">{t('available')}</span>
      </label>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">{t('cancel')}</Button>
        <Button type="submit" loading={saving} className="flex-1">{t('saveChanges')}</Button>
      </div>
    </form>
  )
}
