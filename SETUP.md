# DiMaria Chop Bar — Setup Guide

## Tech Stack
- **Frontend**: Next.js 15 (App Router)
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Deployment**: Vercel
- **Styling**: Tailwind CSS
- **Notifications**: WhatsApp Cloud API

---

## 1. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Project name: `dimaria-chop-bar`
3. Note your Project URL and anon/service_role keys

### Run Database Migration
In Supabase Dashboard → SQL Editor, run:
```
supabase/migrations/001_initial_schema.sql
```
This creates all tables, RLS policies, storage buckets, and seeds menu items.

### Create Staff Accounts

**Mary (Kitchen Staff):**
1. Supabase Dashboard → Authentication → Users → Add User
2. Email: `mary@dimaria.com` | Password: (secure password)
3. Copy the user UUID from the list
4. Run in SQL Editor:
```sql
insert into public.users (id, name, phone, role)
values ('MARY_UUID_HERE', 'Mary', '0533607247', 'kitchen');
```

**Admin Account:**
1. Register normally via the app at `/register`
2. Promote to admin in SQL Editor:
```sql
update public.users set role = 'admin' where id = 'USER_UUID_HERE';
```

---

## 2. WhatsApp Cloud API Setup

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a Meta App → Add WhatsApp product
3. Get a test phone number or verify your business number
4. Note:
   - `WHATSAPP_API_TOKEN` = your permanent token
   - `WHATSAPP_PHONE_NUMBER_ID` = from the WhatsApp dashboard
5. Add Mary's number (233533607247) as a recipient in test mode

---

## 3. Environment Variables

Create `.env.local` with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://bgjqicoruxeqvzzimdqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

WHATSAPP_API_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

MARY_WHATSAPP=233533607247
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 4. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 5. Deploy to Vercel

```bash
npx vercel
```

Or connect GitHub repo at [vercel.com](https://vercel.com) and add environment variables in project settings.

---

## User Roles

| Role | Access | Account |
|------|--------|---------|
| `customer` | Menu, Cart, Checkout, Orders | Self-register |
| `kitchen` | Kitchen dashboard only | Created by admin |
| `admin` | All pages + Admin dashboard | Promoted via SQL |

---

## Application Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Menu homepage | Public |
| `/cart` | Shopping cart | Public |
| `/checkout` | Place order | Authenticated |
| `/orders` | Order history | Customer |
| `/orders/[id]` | Order detail + screenshot upload | Customer |
| `/kitchen` | Kitchen dashboard | Kitchen + Admin |
| `/admin` | Admin analytics dashboard | Admin |
| `/admin/menu` | Menu management | Admin |
| `/login` | Login | Public |
| `/register` | Register | Public |

---

## Payment Flow

1. Customer places order → WhatsApp sent to customer + Mary
2. Customer sends MoMo to Mary (0533607247)
3. Customer uploads screenshot at `/orders/[id]`
4. Mary sees alert in kitchen dashboard
5. Mary views screenshot → confirms or rejects payment
6. Status updates in real-time → WhatsApp notifications sent
7. Mary marks order: Preparing → Ready → Delivered

---

## WhatsApp Notifications Sent

| Trigger | Recipients |
|---------|-----------|
| Order placed | Customer + Mary |
| Screenshot uploaded | Mary |
| Payment confirmed | Customer |
| Preparing | Customer |
| Ready for pickup | Customer |
| Out for delivery | Customer |
| Delivered | Customer |
