#!/usr/bin/env node
/**
 * DiMaria Chop Bar — Create Staff Account
 *
 * Creates Mary's kitchen staff account directly via Supabase Admin API.
 *
 * Usage:
 *   node scripts/create-staff.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('\n❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local\n')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Staff accounts to create
const STAFF = [
  {
    email: 'mary@dimaria.com',
    password: process.env.MARY_PASSWORD || randomBytes(12).toString('hex'),
    name: 'Mary',
    phone: '0533607247',
    role: 'kitchen',
  },
]

for (const staff of STAFF) {
  console.log(`\n👤  Creating ${staff.role} account for ${staff.name} (${staff.email})…`)

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: staff.email,
    password: staff.password,
    email_confirm: true,
    user_metadata: { name: staff.name },
  })

  if (authErr) {
    if (authErr.message?.includes('already registered')) {
      console.log(`⚠️   ${staff.email} already exists — updating role…`)
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existing = users.find((u) => u.email === staff.email)
      if (existing) {
        await supabase.from('users').upsert({
          id: existing.id,
          name: staff.name,
          phone: staff.phone,
          role: staff.role,
        })
        console.log(`✅  Role updated to "${staff.role}"`)
      }
      continue
    }
    console.error(`❌  Failed to create ${staff.email}:`, authErr.message)
    continue
  }

  const { error: profileErr } = await supabase.from('users').insert({
    id: authData.user.id,
    name: staff.name,
    phone: staff.phone,
    role: staff.role,
  })

  if (profileErr) {
    console.error(`❌  Failed to create profile for ${staff.email}:`, profileErr.message)
    continue
  }

  console.log(`✅  Created ${staff.name} (${staff.role})`)
  console.log(`    Email:    ${staff.email}`)
  console.log(`    Password: ${staff.password}`)
  console.log(`    ⚠️   Save this password — it won't be shown again!`)
}

console.log('\n🎉  Staff setup complete!\n')
