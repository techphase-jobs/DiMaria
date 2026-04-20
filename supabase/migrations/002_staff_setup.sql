-- Run this AFTER creating staff accounts through Supabase Auth dashboard
-- or via the Supabase API

-- To create Mary's kitchen account:
-- 1. Go to Supabase Dashboard → Authentication → Users → Add User
-- 2. Email: mary@dimaria.com (or any email)
-- 3. Password: (set a secure password)
-- 4. After creation, run the INSERT below with her user ID

-- To create admin account:
-- 1. Same process, use admin@dimaria.com
-- 2. After creation, run the INSERT below with admin's user ID

-- EXAMPLE (replace UUIDs with actual auth user IDs):
-- insert into public.users (id, name, phone, role) values
--   ('MARY_AUTH_UUID', 'Mary', '0533607247', 'kitchen'),
--   ('ADMIN_AUTH_UUID', 'Admin', null, 'admin')
-- on conflict (id) do update set role = excluded.role;

-- Quick admin promotion (run after user registers normally):
-- update public.users set role = 'admin' where id = 'USER_UUID';
-- update public.users set role = 'kitchen' where id = 'USER_UUID';
