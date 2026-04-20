#!/usr/bin/env node
/**
 * DiMaria Chop Bar — Database Setup Script
 *
 * Applies the migration SQL to your Supabase project via the Management API.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=<your-pat> node scripts/setup-db.mjs
 *
 * Or set SUPABASE_ACCESS_TOKEN in your .env.local and run:
 *   node -r dotenv/config scripts/setup-db.mjs
 *
 * Get your Personal Access Token at: https://supabase.com/dashboard/account/tokens
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// Load .env.local manually if no token in environment
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

const PROJECT_REF = 'bgjqicoruxeqvzzimdqk'
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!ACCESS_TOKEN) {
  console.error('\n❌  SUPABASE_ACCESS_TOKEN is not set.')
  console.error('    Get one at: https://supabase.com/dashboard/account/tokens')
  console.error('    Then run: SUPABASE_ACCESS_TOKEN=<token> node scripts/setup-db.mjs\n')
  process.exit(1)
}

const sql = readFileSync(resolve(ROOT, 'supabase/migrations/001_initial_schema.sql'), 'utf8')

console.log(`\n🚀 Applying migration to project ${PROJECT_REF}…\n`)

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  }
)

if (!res.ok) {
  const body = await res.text()
  console.error('❌  Migration failed:', res.status, body)
  process.exit(1)
}

console.log('✅  Migration applied successfully!')
console.log('\nNext steps:')
console.log('  1. Create Mary\'s account in Supabase Auth dashboard')
console.log('  2. Run: node scripts/promote-user.mjs mary@dimaria.com kitchen')
console.log('  3. Register your admin account at /register, then:')
console.log('     node scripts/promote-user.mjs admin@example.com admin\n')
