'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const inp = { padding: '10px 12px', background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', outline: 'none' }

export default function ApiKeys() {
  const [keys, setKeys] = useState([])
  const [name, setName] = useState('')
  const [created, setCreated] = useState(null) // full key shown once
  const [copied, setCopied] = useState(false)
  const load = () => api.getApiKeys().then(k => setKeys(Array.isArray(k) ? k : [])).catch(() => {})
  useEffect(() => { load() }, [])

  const add = async () => {
    try { const r = await api.createApiKey(name.trim() || 'API key'); setCreated(r); setName(''); load() } catch (e) { alert(e?.message || 'Failed') }
  }
  const del = async (id) => { if (!confirm('Revoke this API key? Apps using it will stop working.')) return; try { await api.deleteApiKey(id); setKeys(k => k.filter(x => x.id !== id)) } catch {} }
  const copy = () => { navigator.clipboard?.writeText(created.key); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const base = 'https://api.hayyaai.com/api/v1/public/leads'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <NavSidebar current="integrations" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto', maxWidth: '780px' }}>
        <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, letterSpacing: '0.08em' }}>INTEGRATIONS</div>
        <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0' }}>API Keys</h1>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Push leads into your CRM from anywhere — website forms, landing pages, ad platforms — using the public API.</p>

        {/* Create */}
        <div style={{ background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '12px', padding: '20px', margin: '20px 0' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Key name (e.g. Website form)" style={{ ...inp, flex: 1, boxSizing: 'border-box' }} />
            <button onClick={add} style={{ padding: '10px 18px', background: '#00e5a0', border: 'none', borderRadius: '8px', color: '#07090f', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>Generate key</button>
          </div>
          {created && (
            <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(0,229,160,.06)', border: '1px solid rgba(0,229,160,.25)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#00e5a0', fontWeight: 700, marginBottom: '6px' }}>✓ Copy this key now — it won’t be shown again</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <code style={{ flex: 1, fontSize: '12px', color: '#e2e8f0', wordBreak: 'break-all' }}>{created.key}</code>
                <button onClick={copy} style={{ padding: '6px 12px', background: '#1a2235', border: 'none', borderRadius: '6px', color: '#e2e8f0', fontSize: '11px', cursor: 'pointer' }}>{copied ? 'Copied' : 'Copy'}</button>
              </div>
            </div>
          )}
        </div>

        {/* Keys list */}
        {keys.length > 0 && (
          <div style={{ background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '12px' }}>Your keys</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {keys.map(k => (
                <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700 }}>{k.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}><code>{k.key}</code> · {k.lastUsedAt ? `last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : 'never used'}</div>
                  </div>
                  <button onClick={() => del(k.id)} style={{ background: 'none', border: '1px solid #1a2235', borderRadius: '6px', color: '#ef4444', fontSize: '11px', cursor: 'pointer', padding: '5px 10px' }}>Revoke</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Docs */}
        <div style={{ background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '10px' }}>Create a lead</div>
          <pre style={{ background: '#07090f', border: '1px solid #1a2235', borderRadius: '8px', padding: '14px', fontSize: '12px', color: '#cbd5e1', overflowX: 'auto', lineHeight: 1.6 }}>{`curl -X POST ${base} \\
  -H "X-API-Key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Ali","phone":"+97455...","email":"ali@x.com","source":"website"}'`}</pre>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px' }}>The lead lands in your CRM (Contacts + inbox) and triggers your <strong style={{ color: '#a78bfa' }}>contact.created</strong> webhook.</div>
        </div>
      </main>
    </div>
  )
}
