'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const INDUSTRIES = ['Healthcare & Medical', 'Dental Clinic', 'Beauty & Spa', 'Real Estate', 'Education & Training', 'Restaurant & Food', 'Legal Services', 'Automotive', 'Retail & E-commerce', 'Hospitality', 'Other']
const COUNTRIES = ['QA', 'SA', 'AE', 'KW', 'BH', 'OM', 'EG', 'JO']
const PLANS = [
  { id: 'STARTER', name: 'Starter', color: '#3b82f6' },
  { id: 'GROWTH', name: 'Growth', color: '#D8B16A' },
  { id: 'ENTERPRISE', name: 'Enterprise', color: '#a78bfa' },
]

export default function NewClient() {
  const [f, setF] = useState({ name: '', industry: 'Healthcare & Medical', country: 'QA', plan: 'STARTER', adminName: '', adminEmail: '' })
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const set = (k, v) => setF(s => ({ ...s, [k]: v }))

  const submit = async () => {
    if (!f.name.trim() || !f.adminEmail.trim()) { setError('Client name and admin email are required'); return }
    setCreating(true); setError('')
    try {
      const r = await api.createMasterOrg(f)
      setResult(r)
    } catch (e) {
      setError(e?.message || 'Failed to create client')
    } finally {
      setCreating(false)
    }
  }

  const inp = { width: '100%', padding: '10px 12px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '8px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '6px' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <NavSidebar current="admin" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto', maxWidth: '680px' }}>
        <div style={{ marginBottom: '6px' }}><a href="/admin" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>← Master Admin</a></div>
        <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, letterSpacing: '0.08em' }}>MASTER CONTROL · OWNER ONLY</div>
        <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 6px' }}>Add New Client</h1>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>Provision a new company workspace in seconds — isolated data, admin account, plan, and welcome email.</p>

        {result ? (
          <div style={{ background: 'rgba(216,177,106,.05)', border: '1px solid rgba(216,177,106,.25)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#D8B16A', marginBottom: '14px' }}>✅ Client created — {result.org?.name}</div>
            <div style={{ background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '8px', padding: '16px', fontSize: '13px', lineHeight: 1.9 }}>
              <div><span style={{ color: '#64748b' }}>Admin email:</span> <strong>{result.org?.users?.[0]?.email}</strong></div>
              <div><span style={{ color: '#64748b' }}>Temp password:</span> <code style={{ background: '#1a2235', padding: '2px 8px', borderRadius: '4px', color: '#D8B16A' }}>{result.tempPassword}</code></div>
              <div><span style={{ color: '#64748b' }}>Plan:</span> {result.plan}</div>
              <div><span style={{ color: '#64748b' }}>Login:</span> {result.loginUrl}</div>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px' }}>A welcome email was sent (if email is configured). Share these credentials with the client — they should change the password on first login.</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => { setResult(null); setF({ name: '', industry: 'Healthcare & Medical', country: 'QA', plan: 'STARTER', adminName: '', adminEmail: '' }) }}
                style={{ padding: '10px 20px', background: '#D8B16A', border: 'none', borderRadius: '8px', color: '#07090f', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>+ Add another</button>
              <a href="/admin" style={{ padding: '10px 20px', background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', color: '#e2e8f0', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>Back to clients</a>
            </div>
          </div>
        ) : (
          <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', color: '#ef4444', fontSize: '13px' }}>⚠️ {error}</div>}
            <div>
              <label style={lbl}>CLIENT / COMPANY NAME *</label>
              <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Smile Dental Clinic" style={inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>INDUSTRY</label>
                <select value={f.industry} onChange={e => set('industry', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>COUNTRY</label>
                <select value={f.country} onChange={e => set('country', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={lbl}>PLAN</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {PLANS.map(p => (
                  <button key={p.id} onClick={() => set('plan', p.id)}
                    style={{ padding: '12px', background: f.plan === p.id ? `${p.color}18` : '#0c0f1a', border: `1px solid ${f.plan === p.id ? p.color : '#1a2235'}`, borderRadius: '8px', color: f.plan === p.id ? p.color : '#94a3b8', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid #1a2235', paddingTop: '16px' }}>
              <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700, marginBottom: '12px' }}>CLIENT ADMIN ACCOUNT</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={lbl}>ADMIN NAME</label>
                  <input value={f.adminName} onChange={e => set('adminName', e.target.value)} placeholder="Contact person" style={inp} />
                </div>
                <div>
                  <label style={lbl}>ADMIN EMAIL *</label>
                  <input type="email" value={f.adminEmail} onChange={e => set('adminEmail', e.target.value)} placeholder="admin@client.com" style={inp} />
                </div>
              </div>
            </div>
            <button onClick={submit} disabled={creating}
              style={{ padding: '12px 28px', background: creating ? '#1a2235' : '#D8B16A', border: 'none', borderRadius: '10px', color: creating ? '#64748b' : '#07090f', fontWeight: 900, fontSize: '14px', cursor: creating ? 'wait' : 'pointer', alignSelf: 'flex-start' }}>
              {creating ? 'Provisioning…' : '🚀 Create Client Workspace'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
