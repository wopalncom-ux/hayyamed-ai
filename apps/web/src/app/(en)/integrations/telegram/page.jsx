'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

export default function TelegramSetup() {
  const [token, setToken] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = () => api.getTelegramStatus().then(setStatus).catch(() => setStatus({ connected: false })).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const connect = async () => {
    if (!token.trim()) return
    setBusy(true); setMsg(null)
    try {
      const r = await api.connectTelegram(token.trim())
      setMsg({ ok: true, text: `Connected to @${r.username} — your bot is live!` })
      setToken('')
      load()
    } catch (e) {
      setMsg({ ok: false, text: e?.message || 'Connection failed' })
    } finally { setBusy(false) }
  }

  const disconnect = async () => {
    setBusy(true)
    try { await api.disconnectTelegram(); setMsg({ ok: true, text: 'Disconnected' }); load() } catch {} finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <NavSidebar current="integrations" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto', maxWidth: '760px' }}>
        <div style={{ marginBottom: '8px' }}><a href="/integrations" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>← Integrations</a></div>
        <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 6px' }}>✈️ Telegram</h1>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>
          Connect a Telegram bot in 2 minutes — no app review. Messages land in your <strong style={{ color: '#e2e8f0' }}>Inbox</strong> and the AI replies from your <strong style={{ color: '#a78bfa' }}>Knowledge Base</strong>.
        </p>

        {loading ? (
          <div style={{ color: '#64748b', padding: '40px', textAlign: 'center' }}>Loading…</div>
        ) : status?.connected ? (
          <div style={{ background: 'rgba(216,177,106,.05)', border: '1px solid rgba(216,177,106,.25)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#D8B16A', marginBottom: '8px' }}>✅ Connected</div>
            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>Bot: <strong>@{status.username}</strong> — message it on Telegram and watch the reply land in your Inbox.</div>
            <button onClick={disconnect} disabled={busy} style={{ marginTop: '16px', padding: '9px 18px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', color: '#ef4444', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Disconnect</button>
          </div>
        ) : (
          <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '12px', padding: '24px' }}>
            <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '6px' }}>BOT TOKEN (from @BotFather)</label>
            <input value={token} onChange={e => setToken(e.target.value)} placeholder="123456789:ABCdef..."
              style={{ width: '100%', padding: '11px 12px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '8px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            <button onClick={connect} disabled={busy || !token.trim()}
              style={{ marginTop: '14px', padding: '11px 24px', background: busy || !token.trim() ? '#1a2235' : '#D8B16A', border: 'none', borderRadius: '8px', color: busy || !token.trim() ? '#64748b' : '#07090f', fontWeight: 800, fontSize: '14px', cursor: busy ? 'wait' : 'pointer' }}>
              {busy ? 'Connecting…' : '✈️ Connect Bot'}
            </button>
            {msg && <div style={{ marginTop: '14px', fontSize: '13px', color: msg.ok ? '#D8B16A' : '#ef4444' }}>{msg.ok ? '✓ ' : '⚠️ '}{msg.text}</div>}
          </div>
        )}

        <div style={{ marginTop: '20px', background: 'rgba(216,177,106,.04)', border: '1px solid rgba(216,177,106,.12)', borderRadius: '10px', padding: '16px 18px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.8 }}>
          <strong style={{ color: '#e2e8f0' }}>How to get a bot token (2 min)</strong>
          <ol style={{ margin: '8px 0 0 18px' }}>
            <li>Open Telegram → search <strong style={{ color: '#D8B16A' }}>@BotFather</strong></li>
            <li>Send <code style={{ background: '#1a2235', padding: '1px 6px', borderRadius: '4px', color: '#D8B16A' }}>/newbot</code> → choose a name + username</li>
            <li>Copy the token it gives you → paste it above → Connect</li>
          </ol>
        </div>
      </main>
    </div>
  )
}
