export type Role = 'customer' | 'kitchen' | 'admin'
export type Language = 'en' | 'fr'
export type DeliveryType = 'pickup' | 'delivery'
export type PaymentStatus = 'pending' | 'uploaded' | 'confirmed' | 'rejected'
export type OrderStatus =
  | 'pending_payment'
  | 'payment_uploaded'
  | 'payment_confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export type MenuCategory =
  | 'Rice Dishes'
  | 'Swallow'
  | 'Soups'
  | 'Drinks'
  | 'Extras'

export interface User {
  id: string
  name: string
  phone: string | null
  location: string | null
  role: Role
  language: Language
  created_at: string
}

export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: MenuCategory
  available: boolean
  sort_order: number
  created_at: string
}

export interface Order {
  id: string
  user_id: string | null
  status: OrderStatus
  total: number
  order_number: string
  delivery_type: DeliveryType
  delivery_address: string | null
  special_instructions: string | null
  payment_screenshot_url: string | null
  payment_status: PaymentStatus
  customer_phone: string | null
  customer_name: string | null
  whatsapp_number: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string | null
  menu_item_name: string
  menu_item_price: number
  quantity: number
  menu_items?: MenuItem
}

export interface CartItem {
  menu_item: MenuItem
  quantity: number
}

export interface CheckoutForm {
  delivery_type: DeliveryType
  delivery_address: string
  special_instructions: string
  customer_name: string
  customer_phone: string
  whatsapp_number: string
}

export type OrderStatusFlow = {
  [K in OrderStatus]: {
    label: { en: string; fr: string }
    color: string
    next: OrderStatus[]
  }
}
