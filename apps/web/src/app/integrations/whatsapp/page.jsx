'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const STEPS = [
  { n: 1, title: 'Create Meta Business Account', desc: 'Go to business.facebook.com and create or use your existing Meta Business Account.' },
  { n: 2, title: 'Create WhatsApp Business App', desc: 'In Meta for Developers → My Apps → Create App → Business. Add the "WhatsApp" product to your app.' },
  { n: 3, title: 'Add a phone number', desc: 'In your app dashboard, go to WhatsApp → Getting Started. Add a phone number and complete business verification.' },
  { n: 4, title: 'Get your credentials', desc: 'Copy your Phone Number ID and generate a permanent access token. Paste them below.' },
  { n: 5, title: 'Set webhook URL', desc: 'In WhatsApp → Configuration, set the Webhook URL and Verify Token, then subscribe to the "messages" field.' },
]

function Step({ n, title, desc, done }) {
  return (
    <div style={{ display: 'flex', gap: '14px', padding: '16px 0', borderBottom: '1px solid #1a2235' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? '#D8B16A' : '#1a2235', color: done ? '#0a0f1a' : '#94a3b8', fontSize: '13px', fontWeight: '800', flexShrink: 0,
      }}>{done ? '✓' : n}</div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#e2e8f0', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>{desc}</div>
      </div>
    </div>
  )
}

function ChannelCard({ channel, onDisconnect }) {
  return (
    <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#25D36622', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>💬</div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '15px', color: '#e2e8f0' }}>{channel.name}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Phone ID: {channel.identifier}</div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '4px', background: channel.isActive ? '#D8B16A22' : '#ef444422', color: channel.isActive ? '#D8B16A' : '#ef4444', fontWeight: '700' }}>
              {channel.isActive ? '● Active' : '○ Inactive'}
            </span>
            {channel.isVerified && (
              <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '4px', background: '#3b82f622', color: '#3b82f6', fontWeight: '700' }}>✓ Verified</span>
            )}
          </div>
        </div>
      </div>
      <button onClick={() => onDisconnect(channel.id)} style={{ padding: '7px 14px', background: '#ef444422', color: '#ef4444', border: '1px solid #ef444433', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
        Disconnect
      </button>
    </div>
  )
}

export default function WhatsAppSetupPage() {
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('overview') // overview | connect | test
  const [form, setForm] = useState({ name: '', phoneNumberId: '', accessToken: '', businessId: '', webhookSecret: '' })
  const [saving, setSaving] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [testing, setTesting] = useState(false)
  const [toast, setToast] = useState(null)

  const load = () => {
    setLoading(true)
    api.getWhatsAppChannels().then(r => setChannels(Array.isArray(r) ? r : [])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

  const handleConnect = async (e) => {
    e.preventDefault()
    if (!form.phoneNumberId || !form.accessToken) return showToast('Phone Number ID and Access Token are required', false)
    setSaving(true)
    try {
      await api.connectWhatsApp(form)
      showToast('WhatsApp channel connected!')
      load()
      setView('overview')
      setForm({ name: '', phoneNumberId: '', accessToken: '', businessId: '', webhookSecret: '' })
    } catch (err) {
      showToast(err.message || 'Connection failed', false)
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async (id) => {
    try {
      await api.disconnectWhatsApp(id)
      showToast('Channel disconnected')
      load()
    } catch { showToast('Failed to disconnect', false) }
  }

  const handleTest = async () => {
    if (!testPhone) return
    setTesting(true)
    try {
      await api.testWhatsApp({ to: testPhone })
      showToast(`Test message sent to ${testPhone}`)
    } catch (err) {
      showToast(err.message || 'Test failed', false)
    } finally {
      setTesting(false)
    }
  }

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin.replace('3000', '4000')}/whatsapp/webhook`
    : 'https://api.hayyaai.com/whatsapp/webhook'

  const verifyToken = 'hayyamed_webhook_2024'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <NavSidebar current="integrations" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto', maxWidth: '800px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <a href="/integrations" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>← Integrations</a>
        </div>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#25D36622', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>💬</div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px' }}>WhatsApp Business API</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Connect your WhatsApp Business number to receive and send messages through Hayya AI. Supports text, media, templates, and interactive buttons.</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {[
            { id: 'overview', label: '📋 Overview' },
            { id: 'connect', label: '+ Connect Number' },
            { id: 'test', label: '🧪 Send Test' },
          ].map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              background: view === t.id ? '#D8B16A' : '#1a2235', color: view === t.id ? '#0a0f1a' : '#94a3b8',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Overview */}
        {view === 'overview' && (
          <div>
            {loading ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Loading channels...</div>
            ) : channels.length === 0 ? (
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
                <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>No WhatsApp channels yet</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Connect your WhatsApp Business number to start receiving and sending messages.</div>
                <button onClick={() => setView('connect')} style={{ padding: '10px 24px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                  Connect WhatsApp →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {channels.map(ch => (
                  <ChannelCard key={ch.id} channel={ch} onDisconnect={handleDisconnect} />
                ))}
                <button onClick={() => setView('connect')} style={{ padding: '10px 20px', background: '#1a2235', color: '#94a3b8', border: '1px dashed #1a2235', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  + Add another number
                </button>
              </div>
            )}

            {/* Webhook info */}
            <div style={{ marginTop: '28px', background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontWeight: '700', marginBottom: '14px', fontSize: '14px' }}>📡 Webhook Configuration</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                {[
                  { label: 'Webhook URL', value: 'https://api.hayyaai.com/whatsapp/webhook' },
                  { label: 'Verify Token', value: verifyToken },
                  { label: 'Subscribe Fields', value: 'messages' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#0a0f1a', borderRadius: '6px' }}>
                    <span style={{ color: '#64748b' }}>{label}</span>
                    <span style={{ fontFamily: 'monospace', color: '#D8B16A', fontSize: '11px' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Connect form */}
        {view === 'connect' && (
          <div>
            {/* Setup guide */}
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ fontWeight: '700', marginBottom: '4px', fontSize: '14px' }}>Setup Guide</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Follow these steps to get your WhatsApp Business API credentials:</div>
              {STEPS.map((s, i) => <Step key={s.n} {...s} done={false} />)}
            </div>

            {/* Connect form */}
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '24px' }}>
              <div style={{ fontWeight: '700', marginBottom: '16px', fontSize: '15px' }}>Connect Your Number</div>
              <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { key: 'name', label: 'Channel Name', placeholder: 'e.g. Clinic Main Line', required: true },
                  { key: 'phoneNumberId', label: 'Phone Number ID', placeholder: 'From Meta Developers → WhatsApp → Getting Started', required: true },
                  { key: 'accessToken', label: 'Permanent Access Token', placeholder: 'EAAxx... (never use temporary tokens)', required: true },
                  { key: 'businessId', label: 'WhatsApp Business Account ID', placeholder: 'Optional — for template management', required: false },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                      {f.label}{f.required && <span style={{ color: '#ef4444' }}> *</span>}
                    </label>
                    <input
                      type={f.key === 'accessToken' ? 'password' : 'text'}
                      value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      required={f.required}
                      style={{ width: '100%', background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '6px', padding: '10px 12px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}

                <div style={{ padding: '12px 14px', background: '#0a0f1a', borderRadius: '6px', border: '1px solid #1a2235', fontSize: '12px', color: '#64748b' }}>
                  <strong style={{ color: '#94a3b8' }}>Important:</strong> Access tokens are stored encrypted server-side and never exposed to the browser. Use a permanent System User token, not a temporary test token.
                </div>

                <button type="submit" disabled={saving} style={{
                  padding: '12px 24px', background: saving ? '#1a2235' : '#25D366', color: saving ? '#64748b' : '#fff',
                  border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '14px',
                }}>{saving ? 'Connecting...' : 'Connect WhatsApp'}</button>
              </form>
            </div>
          </div>
        )}

        {/* Test send */}
        {view === 'test' && (
          <div>
            {channels.filter(c => c.isActive).length === 0 ? (
              <div style={{ background: '#111622', border: '1px solid #ef444433', borderRadius: '10px', padding: '24px', textAlign: 'center', color: '#ef4444' }}>
                No active WhatsApp channel. <button onClick={() => setView('connect')} style={{ background: 'none', border: 'none', color: '#D8B16A', cursor: 'pointer', fontWeight: '700' }}>Connect one first →</button>
              </div>
            ) : (
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '24px' }}>
                <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '15px' }}>🧪 Send Test Message</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
                  Sends a confirmation message from your active WhatsApp channel. The recipient must have WhatsApp installed.
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="+97412345678 (international format)"
                    style={{ flex: 1, background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '6px', padding: '10px 12px', color: '#e2e8f0', fontSize: '13px' }}
                  />
                  <button onClick={handleTest} disabled={testing || !testPhone} style={{
                    padding: '10px 20px', background: testing || !testPhone ? '#1a2235' : '#25D366',
                    color: testing || !testPhone ? '#64748b' : '#fff', border: 'none', borderRadius: '6px', cursor: testing || !testPhone ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap',
                  }}>{testing ? 'Sending...' : 'Send Test'}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '8px',
            background: toast.ok ? '#D8B16A' : '#ef4444', color: toast.ok ? '#0a0f1a' : '#fff',
            fontWeight: '700', fontSize: '14px', zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>{toast.msg}</div>
        )}
      </main>
    </div>
  )
}
