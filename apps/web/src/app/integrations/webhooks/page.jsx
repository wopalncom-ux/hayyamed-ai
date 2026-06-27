'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const EVENTS = [
  { id: '*', label: 'All events' },
  { id: 'contact.created', label: 'New lead / contact created' },
  { id: 'conversation.escalated', label: 'Conversation escalated to human' },
  { id: 'payment.created', label: 'Payment link created' },
]

const inp = { width: '100%', padding: '10px 12px', background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }

export default function Webhooks() {
  const [hooks, setHooks] = useState([])
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState('*')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [toast, setToast] = useState(null)
  const flash = (ok, msg) => { setToast({ ok, msg }); setTimeout(() => setToast(null), 3500) }

  const load = () => api.getWebhooks().then(h => setHooks(Array.isArray(h) ? h : [])).catch(() => {})
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!url.trim()) return flash(false, 'Enter a URL')
    setSaving(true)
    try { await api.createWebhook(url.trim(), events); setUrl(''); await load(); flash(true, 'Webhook added') }
    catch (e) { flash(false, e?.message || 'Failed') } finally { setSaving(false) }
  }
  const test = async () => {
    if (!url.trim()) return flash(false, 'Enter a URL to test')
    setTesting(true)
    try { const r = await api.testWebhook(url.trim()); flash(r.delivered, r.delivered ? `Delivered (HTTP ${r.status})` : `Not delivered (HTTP ${r.status})`) }
    catch (e) { flash(false, e?.message || 'Test failed') } finally { setTesting(false) }
  }
  const del = async (id) => { try { await api.deleteWebhook(id); setHooks(h => h.filter(x => x.id !== id)) } catch {} }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <NavSidebar current="integrations" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto', maxWidth: '760px' }}>
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, letterSpacing: '0.08em' }}>INTEGRATIONS</div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0' }}>Webhooks</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Send real-time events to your own systems (Zapier, Make, a Slack relay, your backend). We POST a JSON payload when the event fires.</p>
        </div>

        <div style={{ background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '12px', padding: '20px', margin: '20px 0' }}>
          <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '12px' }}>Add a webhook</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-endpoint.com/hook" style={inp} />
            <select value={events} onChange={e => setEvents(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {EVENTS.map(ev => <option key={ev.id} value={ev.id}>{ev.label}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={add} disabled={saving} style={{ flex: 1, padding: '11px', background: '#00e5a0', border: 'none', borderRadius: '8px', color: '#07090f', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>{saving ? 'Adding…' : 'Add webhook'}</button>
              <button onClick={test} disabled={testing} style={{ padding: '11px 16px', background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.3)', borderRadius: '8px', color: '#a78bfa', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>{testing ? '…' : 'Send test'}</button>
            </div>
            <div style={{ fontSize: '10px', color: '#475569' }}>Payload: <code style={{ color: '#a78bfa' }}>{'{ event, data, timestamp }'}</code>. Header <code style={{ color: '#a78bfa' }}>X-Hayya-Event</code> identifies the event.</div>
          </div>
        </div>

        {hooks.length > 0 && (
          <div style={{ background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '12px' }}>Active webhooks</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hooks.map(h => (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, wordBreak: 'break-all' }}>{h.url}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{h.events === '*' ? 'All events' : h.events}</div>
                  </div>
                  <button onClick={() => del(h.id)} style={{ background: 'none', border: '1px solid #1a2235', borderRadius: '6px', color: '#ef4444', fontSize: '11px', cursor: 'pointer', padding: '5px 10px' }}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      {toast && <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: toast.ok ? '#00e5a0' : '#ef4444', color: toast.ok ? '#07090f' : '#fff', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', zIndex: 100 }}>{toast.msg}</div>}
    </div>
  )
}
