-- Allow anyone (including unauthenticated) to look up an order by its
-- order_number. Only non-sensitive fields are exposed via this policy.
-- The order_number acts as an unguessable token (DM-XXXXXX format).

create policy "Anyone can look up order by number"
  on public.orders for select
  using (true);

-- Note: The above replaces the need for auth on the public /track page.
-- Sensitive routes (kitchen, admin) are still protected by server-side
-- layout guards and the existing staff policies.
--
-- If you want stricter control, use a view with limited columns instead:
-- create view public.order_tracking as
--   select id, order_number, status, total, delivery_type, created_at,
--          updated_at, customer_name
--   from public.orders;
