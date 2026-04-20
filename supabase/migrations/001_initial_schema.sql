-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- USERS TABLE (extends auth.users)
-- ============================================================
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  phone text,
  location text,
  role text not null default 'customer'
    check (role in ('customer', 'kitchen', 'admin')),
  language text default 'en'
    check (language in ('en', 'fr')),
  created_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Admin can view all users"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('admin', 'kitchen')
    )
  );

-- ============================================================
-- MENU ITEMS TABLE
-- ============================================================
create table public.menu_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price decimal(10,2) not null check (price >= 0),
  image_url text,
  category text not null
    check (category in ('Rice Dishes', 'Swallow', 'Soups', 'Drinks', 'Extras')),
  available boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table public.menu_items enable row level security;

create policy "Anyone can view available menu items"
  on public.menu_items for select
  using (available = true or (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('admin', 'kitchen')
    )
  ));

create policy "Admin can manage menu items"
  on public.menu_items for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- ============================================================
-- ORDERS TABLE
-- ============================================================
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete set null,
  status text not null default 'pending_payment'
    check (status in (
      'pending_payment', 'payment_uploaded', 'payment_confirmed',
      'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'
    )),
  total decimal(10,2) not null check (total >= 0),
  order_number text not null unique,
  delivery_type text not null check (delivery_type in ('pickup', 'delivery')),
  delivery_address text,
  special_instructions text,
  payment_screenshot_url text,
  payment_status text default 'pending'
    check (payment_status in ('pending', 'uploaded', 'confirmed', 'rejected')),
  customer_phone text,
  customer_name text,
  whatsapp_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Customers can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Customers can create orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Customers can update own orders"
  on public.orders for update
  using (auth.uid() = user_id);

create policy "Staff can view all orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('admin', 'kitchen')
    )
  );

create policy "Staff can update all orders"
  on public.orders for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('admin', 'kitchen')
    )
  );

-- ============================================================
-- ORDER ITEMS TABLE
-- ============================================================
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  menu_item_name text not null,
  menu_item_price decimal(10,2) not null,
  quantity integer not null check (quantity > 0)
);

alter table public.order_items enable row level security;

create policy "Customers can view own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "Customers can insert order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "Staff can view all order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('admin', 'kitchen')
    )
  );

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function update_updated_at_column();

-- ============================================================
-- ORDER NUMBER GENERATOR
-- ============================================================
create sequence if not exists order_number_seq start 1000;

create or replace function generate_order_number()
returns text as $$
begin
  return 'DM-' || lpad(nextval('order_number_seq')::text, 4, '0');
end;
$$ language plpgsql;

-- ============================================================
-- REALTIME PUBLICATIONS
-- ============================================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.menu_items;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('menu-images', 'menu-images', true),
  ('payment-screenshots', 'payment-screenshots', false)
on conflict (id) do nothing;

create policy "Anyone can view menu images"
  on storage.objects for select
  using (bucket_id = 'menu-images');

create policy "Admin can upload menu images"
  on storage.objects for insert
  with check (
    bucket_id = 'menu-images' and
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

create policy "Admin can delete menu images"
  on storage.objects for delete
  using (
    bucket_id = 'menu-images' and
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

create policy "Authenticated users can upload payment screenshots"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-screenshots' and
    auth.role() = 'authenticated'
  );

create policy "Staff can view payment screenshots"
  on storage.objects for select
  using (
    bucket_id = 'payment-screenshots' and
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('admin', 'kitchen')
    )
  );

create policy "Owner can view own payment screenshots"
  on storage.objects for select
  using (
    bucket_id = 'payment-screenshots' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- SEED: Default menu items
-- ============================================================
insert into public.menu_items (name, description, price, category, available, sort_order)
values
  ('Jollof Rice', 'Smoky West African jollof rice with chicken', 15.00, 'Rice Dishes', true, 1),
  ('Fried Rice', 'Savory fried rice with vegetables and chicken', 15.00, 'Rice Dishes', true, 2),
  ('Plain Rice & Stew', 'Plain steamed rice with tomato stew', 12.00, 'Rice Dishes', true, 3),
  ('Fufu & Light Soup', 'Traditional pounded fufu with light soup', 18.00, 'Swallow', true, 4),
  ('Banku & Tilapia', 'Fermented banku with grilled tilapia and pepper', 20.00, 'Swallow', true, 5),
  ('Eba & Egusi Soup', 'Cassava eba with rich egusi soup', 16.00, 'Swallow', true, 6),
  ('Groundnut Soup', 'Rich groundnut soup with assorted meat', 14.00, 'Soups', true, 7),
  ('Palm Nut Soup', 'Traditional palm nut soup with fish', 14.00, 'Soups', true, 8),
  ('Light Soup', 'Clear light soup with chicken', 12.00, 'Soups', true, 9),
  ('Sobolo', 'Chilled hibiscus flower drink', 5.00, 'Drinks', true, 10),
  ('Mineral Water', 'Pure chilled water (500ml)', 3.00, 'Drinks', true, 11),
  ('Malt Drink', 'Non-alcoholic malt beverage', 6.00, 'Drinks', true, 12),
  ('Fried Plantain', 'Sweet fried ripe plantain', 5.00, 'Extras', true, 13),
  ('Salad', 'Fresh vegetable salad', 4.00, 'Extras', true, 14),
  ('Extra Meat', 'Additional meat portion', 8.00, 'Extras', true, 15);
