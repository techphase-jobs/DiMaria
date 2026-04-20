#!/usr/bin/env node
/**
 * DiMaria Chop Bar — Promote User Role
 *
 * Usage:
 *   node scripts/promote-user.mjs <email> <role>
 *
 * Roles: customer | kitchen | admin
 *
 * Examples:
 *   node scripts/promote-user.mjs mary@dimaria.com kitchen
 *   node scripts/promote-user.mjs owner@dimaria.com admin
 *
 * Requires SUPABASE_ACCESS_TOKEN and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

function loadEnv() {
  try {
    const env = readFileSync(resolve(ROOT, '.env.local'), 'utf8')
    for (const line of env.split('\n')) {
      const [key, ...rest] = line.split('=')
      if (key && rest.length && !process.env[key.trim()]) {
        process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '')
      }
    }
  } catch {}
}

loadEnv()

const [, , email, role] = process.argv

const VALID_ROLES = ['customer', 'kitchen', 'admin']

if (!email || !role || !VALID_ROLES.includes(role)) {
  console.error(`\nUsage: node scripts/promote-user.mjs <email> <role>`)
  console.error(`Roles: ${VALID_ROLES.join(' | ')}\n`)
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('\n❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local\n')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

console.log(`\n🔍  Looking up user: ${email}…`)

// Find user by email via Admin API
const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
if (listErr) {
  console.error('❌  Failed to list users:', listErr.message)
  process.exit(1)
}

const authUser = users.find((u) => u.email === email)
if (!authUser) {
  console.error(`❌  No auth user found with email: ${email}`)
  console.error('    Make sure the user has registered/been created first.\n')
  process.exit(1)
}

console.log(`✅  Found user: ${authUser.id}`)
console.log(`🔄  Updating role to "${role}"…`)

// Upsert into public.users with new role
const { error: upsertErr } = await supabase
  .from('users')
  .upsert({
    id: authUser.id,
    name: authUser.user_metadata?.name || email.split('@')[0],
    role,
  })

if (upsertErr) {
  console.error('❌  Failed to update role:', upsertErr.message)
  process.exit(1)
}

console.log(`\n✅  ${email} is now "${role}"\n`)

if (role === 'kitchen') {
  console.log('  → Mary can now log in and access /kitchen')
} else if (role === 'admin') {
  console.log('  → Admin can now access /admin and /admin/menu')
}
console.log()
