'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const STEPS = [
  { n: 1, title: 'Create Meta Business Account', desc: 'Go to business.facebook.com and create or use your existing Meta Business Account.' },
  { n: 2, title: 'Add the Instagram product', desc: 'In Meta for Developers → My Apps → your app → Add Product → Instagram (or Messenger → enable Instagram messaging).' },
  { n: 3, title: 'Connect your Instagram professional account', desc: 'Link an Instagram professional account (linked to a Facebook Page) to the app.' },
  { n: 4, title: 'Get your credentials', desc: 'Copy your Instagram Business Account ID and generate a Page access token with instagram_manage_messages. Paste them below.' },
  { n: 5, title: 'Set webhook URL', desc: 'In Webhooks → Instagram, set the Webhook URL and Verify Token below, then subscribe to the "messages" field.' },
]

function Step({ n, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: '14px', padding: '16px 0', borderBottom: '1px solid #1a2235' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#1a2235', color: '#94a3b8', fontSize: '13px', fontWeight: '800', flexShrink: 0,
      }}>{n}</div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#e2e8f0', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>{desc}</div>
      </div>
    </div>
  )
}

export default function InstagramSetupPage() {
  const [status, setStatus] = useState({ connected: false, username: null })
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('overview') // overview | connect
  const [form, setForm] = useState({ igAccountId: '', accessToken: '', username: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const load = () => {
    setLoading(true)
    api.getInstagramStatus().then(r => setStatus(r || { connected: false })).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

  const handleConnect = async (e) => {
    e.preventDefault()
    if (!form.igAccountId || !form.accessToken) return showToast('Instagram Account ID and Access Token are required', false)
    setSaving(true)
    try {
      await api.connectInstagram(form)
      showToast('Instagram account connected!')
      load()
      setView('overview')
      setForm({ igAccountId: '', accessToken: '', username: '' })
    } catch (err) {
      showToast(err.message || 'Connection failed', false)
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await api.disconnectInstagram()
      showToast('Instagram disconnected')
      load()
    } catch { showToast('Failed to disconnect', false) }
  }

  const webhookUrl = 'https://api.hayyaai.com/api/v1/instagram/webhook'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <NavSidebar current="integrations" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto', maxWidth: '800px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <a href="/integrations" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>← Integrations</a>
        </div>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#ec489922', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>📸</div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px' }}>Instagram Messaging</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Connect your Instagram professional account to receive and reply to DMs through Hayya AI, grounded in your trained knowledge base.</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {[
            { id: 'overview', label: '📋 Overview' },
            { id: 'connect', label: '+ Connect Account' },
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
              <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Loading status...</div>
            ) : !status.connected ? (
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📸</div>
                <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>No Instagram account connected</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Connect your Instagram professional account to start receiving and sending DMs.</div>
                <button onClick={() => setView('connect')} style={{ padding: '10px 24px', background: '#ec4899', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                  Connect Instagram →
                </button>
              </div>
            ) : (
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#ec489922', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>📸</div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#e2e8f0' }}>{status.username ? `@${status.username}` : 'Instagram account'}</div>
                    <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '4px', background: '#D8B16A22', color: '#D8B16A', fontWeight: '700' }}>● Active</span>
                  </div>
                </div>
                <button onClick={handleDisconnect} style={{ padding: '7px 14px', background: '#ef444422', color: '#ef4444', border: '1px solid #ef444433', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                  Disconnect
                </button>
              </div>
            )}

            {/* Webhook info */}
            <div style={{ marginTop: '28px', background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontWeight: '700', marginBottom: '14px', fontSize: '14px' }}>📡 Webhook Configuration</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                {[
                  { label: 'Webhook URL', value: webhookUrl },
                  { label: 'Verify Token', value: 'the value set in WHATSAPP_WEBHOOK_TOKEN (Secret Manager)' },
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
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Follow these steps to get your Instagram credentials:</div>
              {STEPS.map(s => <Step key={s.n} {...s} />)}
            </div>

            {/* Connect form */}
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '24px' }}>
              <div style={{ fontWeight: '700', marginBottom: '16px', fontSize: '15px' }}>Connect Your Account</div>
              <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { key: 'igAccountId', label: 'Instagram Business Account ID', placeholder: 'From Meta Developers → Instagram → Getting Started', required: true },
                  { key: 'accessToken', label: 'Page Access Token', placeholder: 'EAAxx... (needs instagram_manage_messages)', required: true },
                  { key: 'username', label: 'Username', placeholder: 'Optional — display label only', required: false },
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
                  <strong style={{ color: '#94a3b8' }}>Important:</strong> Access tokens are stored encrypted server-side and never exposed to the browser. Credentials are verified against Meta before saving — bad or expired tokens are rejected, not silently saved.
                </div>

                <button type="submit" disabled={saving} style={{
                  padding: '12px 24px', background: saving ? '#1a2235' : '#ec4899', color: saving ? '#64748b' : '#fff',
                  border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '14px',
                }}>{saving ? 'Connecting...' : 'Connect Instagram'}</button>
              </form>
            </div>
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
