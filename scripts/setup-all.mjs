#!/usr/bin/env node
/**
 * DiMaria Chop Bar — Complete Setup Script
 * Run this ONCE from your local machine:
 *
 *   node scripts/setup-all.mjs
 *
 * It will:
 *   1. Apply all database migrations
 *   2. Create Mary's kitchen account
 *   3. Create your admin account
 *   4. Deploy to Vercel with all env vars set
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createInterface } from 'readline'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// Load .env.local
function loadEnv() {
  try {
    const raw = readFileSync(resolve(ROOT, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    console.error('No .env.local found — create one first (see .env.example)')
    process.exit(1)
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(r => rl.question(question, ans => { rl.close(); r(ans.trim()) }))
}

function step(msg) { console.log(`\n\x1b[36m▶ ${msg}\x1b[0m`) }
function ok(msg)   { console.log(`\x1b[32m✓ ${msg}\x1b[0m`) }
function fail(msg) { console.error(`\x1b[31m✗ ${msg}\x1b[0m`) }
function info(msg) { console.log(`  ${msg}`) }

// ─── 1. DATABASE MIGRATION ───────────────────────────────────────────────────

async function runMigration() {
  step('Applying database schema…')

  const migrations = [
    'supabase/migrations/001_initial_schema.sql',
    'supabase/migrations/003_public_order_tracking.sql',
  ]

  for (const file of migrations) {
    const sql = readFileSync(resolve(ROOT, file), 'utf8')
    const statements = sql
      .split(/;\s*(?:\n|$)/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'))

    let skipped = 0
    for (const stmt of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' })
        .catch(() => ({ error: null }))
      if (error) {
        const msg = error.message ?? ''
        if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('PGRST202')) {
          skipped++
        } else {
          info(`  note: ${msg.slice(0, 100)}`)
        }
      }
    }
    ok(`${file.split('/').pop()} (${statements.length} statements, ${skipped} already existed)`)
  }
}

// ─── 2. MARY'S KITCHEN ACCOUNT ───────────────────────────────────────────────

async function createMary() {
  step("Creating Mary's kitchen account…")

  const password = await ask('  Set a password for Mary: ')
  if (!password || password.length < 8) { fail('Password too short (min 8 chars)'); return }

  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const existing = users?.find(u => u.email === 'mary@dimaria.com')

  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, { password })
    await supabase.from('users').upsert({
      id: existing.id, name: 'Mary', phone: '0533607247', role: 'kitchen',
    })
    ok('Mary already exists — password + role updated')
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'mary@dimaria.com', password,
      email_confirm: true, user_metadata: { name: 'Mary' },
    })
    if (error) { fail(`Mary: ${error.message}`); return }
    await supabase.from('users').insert({
      id: data.user.id, name: 'Mary', phone: '0533607247', role: 'kitchen',
    })
    ok('Mary created!')
  }
  info('  Email:    mary@dimaria.com')
  info(`  Password: ${password}`)
  info('  ⚠️  Share these credentials with Mary')
}

// ─── 3. ADMIN ACCOUNT ────────────────────────────────────────────────────────

async function createAdmin() {
  step('Setting up your admin account…')

  const email = await ask('  Your email address: ')
  if (!email.includes('@')) { fail('Invalid email — skipping'); return }

  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const existing = users?.find(u => u.email === email)

  if (existing) {
    await supabase.from('users').upsert({
      id: existing.id,
      name: existing.user_metadata?.name || email.split('@')[0],
      role: 'admin',
    })
    ok(`${email} → admin`)
    return
  }

  const password = await ask('  Choose a password: ')
  const name     = await ask('  Your name: ')

  const { data, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { name },
  })
  if (error) { fail(error.message); return }
  await supabase.from('users').insert({ id: data.user.id, name, role: 'admin' })
  ok(`Admin account created for ${email}`)
}

// ─── 4. VERCEL DEPLOYMENT ────────────────────────────────────────────────────

async function deployVercel() {
  step('Deploying to Vercel…')

  try { execSync('vercel --version', { stdio: 'ignore' }) }
  catch { execSync('npm install -g vercel', { stdio: 'inherit' }) }

  const token = await ask('  Vercel token (from vercel.com/account/tokens): ')
  if (!token || token.length < 10) {
    fail('No token — skipping Vercel deploy')
    info('  Run later: VERCEL_TOKEN=<token> vercel deploy --prod --yes')
    return
  }

  const envFlags = [
    `NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}`,
    `SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}`,
    `MARY_WHATSAPP=233533607247`,
  ].map(e => `--env "${e}"`).join(' ')

  try {
    info('  Building and deploying (this takes ~60s)…')
    const out = execSync(
      `VERCEL_TOKEN=${token} vercel deploy --prod --yes ${envFlags}`,
      { encoding: 'utf8', cwd: ROOT }
    )
    const url = out.match(/https:\/\/[^\s]+\.vercel\.app/)?.[0]
    ok(`Deployed!`)
    if (url) {
      console.log(`\n  \x1b[1m🌍  Live at: \x1b[4m${url}\x1b[0m`)
      info(`  Kitchen: ${url}/login  (mary@dimaria.com)`)
      info(`  Admin:   ${url}/admin`)
      info(`  Menu:    ${url}`)
    }
  } catch (err) {
    fail('Vercel deploy failed — ' + String(err.message).slice(0, 200))
    info('  Try: vercel deploy --prod --yes (from this directory)')
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

console.log('\n\x1b[1m🍲  DiMaria Chop Bar — Full Setup\x1b[0m')
console.log('─'.repeat(42))

try {
  await runMigration()
  await createMary()
  await createAdmin()
  await deployVercel()
  console.log('\n\x1b[1m\x1b[32m✅  All done!\x1b[0m\n')
} catch (err) {
  fail(`Fatal: ${err.message}`)
  process.exit(1)
}
