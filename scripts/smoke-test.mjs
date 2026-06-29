#!/usr/bin/env node
/**
 * Hayya AI — production smoke test.
 *
 * Verifies the live platform is healthy after a deploy: auth, access control,
 * security headers, all key read endpoints, CRM CRUD, settings write, AI
 * generation, and go-live channel status. Read-only except a throwaway contact
 * (created + deleted) and a settings write that restores itself.
 *
 *   API_URL=https://api.hayyaai.com/api/v1 \
 *   SMOKE_EMAIL=owner@example.com SMOKE_PASSWORD=secret \
 *   node scripts/smoke-test.mjs
 *
 * Exit code 0 = all passed, 1 = one or more failures.
 */

const API = process.env.API_URL || 'https://api.hayyaai.com/api/v1'
const WEB = process.env.WEB_URL || 'https://www.hayyaai.com'
const EMAIL = process.env.SMOKE_EMAIL
const PASSWORD = process.env.SMOKE_PASSWORD

if (!EMAIL || !PASSWORD) {
  console.error('✗ Set SMOKE_EMAIL and SMOKE_PASSWORD env vars (owner login).')
  process.exit(1)
}

let pass = 0, fail = 0
const ok = (n, cond, extra = '') => { (cond ? pass++ : fail++); console.log(`${cond ? '✓' : '✗'} ${n}${extra ? '  — ' + extra : ''}`) }
const section = (t) => console.log(`\n── ${t} ──`)

let token = ''
const authd = (path, opts = {}) =>
  fetch(`${API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } })

async function run() {
  section('Auth & access control')
  const login = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) })
  const auth = await login.json().catch(() => ({}))
  token = auth.accessToken || ''
  ok('owner login returns a token', !!token)
  ok('no-token request is rejected (401)', (await fetch(`${API}/contacts`)).status === 401)
  ok('bad-token request is rejected (401)', (await fetch(`${API}/reports/full`, { headers: { Authorization: 'Bearer nope' } })).status === 401)
  const headers = (await authd('/contacts')).headers
  ok('helmet security headers present', !!headers.get('strict-transport-security'))
  if (!token) { summarize(); return }

  section('Core read endpoints')
  const reads = ['/users/me', '/settings', '/reports/full', '/reports/today', '/contacts', '/conversations',
    '/ai/providers', '/chatbots', '/knowledge-bases', '/campaigns', '/workflows', '/ai-agents', '/notifications',
    '/bookings', '/marketplace', '/whatsapp/channels', '/integrations', '/payments/myfatoorah/status', '/agency/overview']
  for (const e of reads) ok(`GET ${e}`, (await authd(e)).status === 200)

  section('Dashboard data integrity')
  const full = await (await authd('/reports/full')).json().catch(() => ({}))
  ok('reports/full has kpis', !!full.kpis)
  ok('reports/full has lead sources array', Array.isArray(full.sources))
  ok('reports/full has leadStats', !!full.leadStats)

  section('CRM CRUD')
  const created = await (await authd('/contacts', { method: 'POST', body: JSON.stringify({ name: 'SMOKE TEST', phone: '+97400000099', status: 'NEW', source: 'manual' }) })).json().catch(() => ({}))
  ok('create contact', !!created.id)
  if (created.id) {
    ok('read contact back', (await authd(`/contacts/${created.id}`)).status === 200)
    ok('delete contact', (await authd(`/contacts/${created.id}`, { method: 'DELETE' })).status === 200)
  }

  section('Settings write (round-trip)')
  const before = await (await authd('/settings')).json().catch(() => ({}))
  const saved = await (await authd('/settings', { method: 'PATCH', body: JSON.stringify({ leadServices: ['Smoke A', 'Smoke B'] }) })).json().catch(() => ({}))
  ok('settings PATCH persists leadServices', Array.isArray(saved.leadServices) && saved.leadServices.includes('Smoke A'))
  // restore prior services
  await authd('/settings', { method: 'PATCH', body: JSON.stringify({ leadServices: Array.isArray(before.leadServices) ? before.leadServices : [] }) })

  section('AI generation (real)')
  const ai = await authd('/ai/campaign-message', { method: 'POST', body: JSON.stringify({ prompt: 'Say hello in one short line.' }) })
  const aiBody = await ai.json().catch(() => ({}))
  ok('AI generates a reply', ai.ok && !!(aiBody.message || aiBody.reply), ai.ok ? '' : `status ${ai.status}`)

  section('Public web pages')
  for (const p of ['/', '/about', '/login']) ok(`web ${p}`, (await fetch(`${WEB}${p}`)).status === 200)

  summarize()
}

function summarize() {
  console.log(`\n${'='.repeat(40)}`)
  console.log(`RESULT: ${pass} passed, ${fail} failed`)
  console.log('='.repeat(40))
  process.exit(fail ? 1 : 0)
}

run().catch(e => { console.error('✗ smoke test crashed:', e.message); process.exit(1) })
