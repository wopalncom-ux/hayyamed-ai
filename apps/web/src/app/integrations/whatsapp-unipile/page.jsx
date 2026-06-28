'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { getAuth, isOwnerRole } from '@/lib/auth'
import NavSidebar from '@/components/NavSidebar'

export default function WhatsAppUnipileSetup() {
  const [platform, setPlatform] = useState(null)   // { configured }
  const [status, setStatus] = useState(null)        // { connected, verified }
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [phone, setPhone] = useState('')
  const [pairing, setPairing] = useState(null)      // { code, qrCodeString }
  const [dsn, setDsn] = useState('')
  const [apiKey, setApiKey] = useState('')
  const owner = isOwnerRole(getAuth()?.role)

  const load = () => Promise.all([
    api.unipilePlatformStatus().catch(() => ({ configured: false })),
    api.unipileWhatsAppStatus().catch(() => ({ connected: false })),
  ]).then(([p, s]) => { setPlatform(p); setStatus(s) }).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const savePlatform = async () => {
    if (!dsn.trim() || !apiKey.trim()) return
    setBusy(true); setMsg(null)
    try {
      await api.saveUnipilePlatform(dsn.trim(), apiKey.trim())
      setMsg({ ok: true, text: 'Unipile account saved. Tenants can now connect WhatsApp.' })
      setDsn(''); setApiKey(''); load()
    } catch (e) { setMsg({ ok: false, text: e?.message || 'Could not save' }) } finally { setBusy(false) }
  }

  const connect = async () => {
    setBusy(true); setMsg(null); setPairing(null)
    try {
      const r = await api.unipileWhatsAppConnect(phone.replace(/[^0-9]/g, '') || undefined)
      setPairing(r)
      setMsg({ ok: true, text: r.code ? 'Enter the code below in WhatsApp.' : 'Scan the QR string below in WhatsApp.' })
      load()
    } catch (e) { setMsg({ ok: false, text: e?.message || 'Connection failed' }) } finally { setBusy(false) }
  }

  const disconnect = async () => {
    setBusy(true)
    try { await api.unipileWhatsAppDisconnect(); setMsg({ ok: true, text: 'Disconnected' }); setPairing(null); load() } catch {} finally { setBusy(false) }
  }

  const card = { background: '#111622', border: '1px solid #1a2235', borderRadius: '12px', padding: '24px' }
  const input = { width: '100%', padding: '11px 12px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '8px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <NavSidebar current="integrations" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto', maxWidth: '760px' }}>
        <div style={{ marginBottom: '8px' }}><a href="/integrations" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>← Integrations</a></div>
        <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 6px' }}>💚 WhatsApp (QR connect)</h1>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>
          Connect your own WhatsApp number — <strong style={{ color: '#e2e8f0' }}>no Meta Business approval</strong>. Messages land in your <strong style={{ color: '#e2e8f0' }}>Inbox</strong> and the AI replies from your <strong style={{ color: '#a78bfa' }}>Knowledge Base</strong>. Powered by Unipile.
        </p>

        {loading ? (
          <div style={{ color: '#64748b', padding: '40px', textAlign: 'center' }}>Loading…</div>
        ) : !platform?.configured ? (
          owner ? (
            <div style={card}>
              <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '4px' }}>Set up the platform Unipile account (one time)</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Create a Unipile account, then paste its DSN and API key. This powers WhatsApp for every workspace.</div>
              <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '6px' }}>UNIPILE DSN (e.g. api8.unipile.com:13443)</label>
              <input value={dsn} onChange={e => setDsn(e.target.value)} placeholder="apiXX.unipile.com:XXXXX" style={input} />
              <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'block', margin: '14px 0 6px' }}>UNIPILE API KEY (X-API-KEY)</label>
              <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Your Unipile access token" type="password" style={input} />
              <button onClick={savePlatform} disabled={busy || !dsn.trim() || !apiKey.trim()}
                style={{ marginTop: '14px', padding: '11px 24px', background: busy || !dsn.trim() || !apiKey.trim() ? '#1a2235' : '#25D366', border: 'none', borderRadius: '8px', color: busy || !dsn.trim() || !apiKey.trim() ? '#64748b' : '#07090f', fontWeight: 800, fontSize: '14px', cursor: busy ? 'wait' : 'pointer' }}>
                {busy ? 'Saving…' : 'Save Unipile account'}
              </button>
              {msg && <div style={{ marginTop: '14px', fontSize: '13px', color: msg.ok ? '#25D366' : '#ef4444' }}>{msg.ok ? '✓ ' : '⚠️ '}{msg.text}</div>}
              <div style={{ marginTop: '14px', fontSize: '12px', color: '#64748b' }}>Get your DSN + key at <a href="https://www.unipile.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>unipile.com</a> (7-day free trial).</div>
            </div>
          ) : (
            <div style={{ ...card, color: '#94a3b8', fontSize: '13px' }}>WhatsApp isn’t set up for your platform yet. Please ask your platform owner to connect the Unipile account.</div>
          )
        ) : status?.connected && status?.verified ? (
          <div style={{ background: 'rgba(37,211,102,.05)', border: '1px solid rgba(37,211,102,.25)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#25D366', marginBottom: '8px' }}>✅ WhatsApp connected</div>
            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>Your number is live. Message it and watch the AI reply land in your Inbox.</div>
            <button onClick={disconnect} disabled={busy} style={{ marginTop: '16px', padding: '9px 18px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', color: '#ef4444', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Disconnect</button>
          </div>
        ) : (
          <div style={card}>
            {status?.connected && !status?.verified && (
              <div style={{ fontSize: '12px', color: '#fbbf24', marginBottom: '14px' }}>⏳ Waiting for you to finish linking on your phone…</div>
            )}
            <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '6px' }}>YOUR WHATSAPP NUMBER (with country code)</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+974 5XXX XXXX" style={input} />
            <button onClick={connect} disabled={busy}
              style={{ marginTop: '14px', padding: '11px 24px', background: busy ? '#1a2235' : '#25D366', border: 'none', borderRadius: '8px', color: busy ? '#64748b' : '#07090f', fontWeight: 800, fontSize: '14px', cursor: busy ? 'wait' : 'pointer' }}>
              {busy ? 'Connecting…' : '💚 Get pairing code'}
            </button>
            {msg && <div style={{ marginTop: '14px', fontSize: '13px', color: msg.ok ? '#25D366' : '#ef4444' }}>{msg.ok ? '✓ ' : '⚠️ '}{msg.text}</div>}

            {pairing?.code && (
              <div style={{ marginTop: '18px', textAlign: 'center', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '10px', padding: '20px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>YOUR PAIRING CODE</div>
                <div style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '6px', color: '#25D366' }}>{pairing.code}</div>
              </div>
            )}
            {pairing?.qrCodeString && !pairing?.code && (
              <div style={{ marginTop: '18px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '10px', padding: '16px', fontSize: '11px', color: '#64748b', wordBreak: 'break-all' }}>
                <div style={{ marginBottom: '8px' }}>QR STRING (open WhatsApp → Linked Devices → scan):</div>
                <code style={{ color: '#cbd5e1' }}>{pairing.qrCodeString}</code>
              </div>
            )}

            <div style={{ marginTop: '18px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.8 }}>
              <strong style={{ color: '#e2e8f0' }}>How to link (1 min)</strong>
              <ol style={{ margin: '8px 0 0 18px' }}>
                <li>Enter your WhatsApp number above → <strong style={{ color: '#25D366' }}>Get pairing code</strong></li>
                <li>On your phone: WhatsApp → <strong>Settings → Linked Devices → Link a Device → Link with phone number</strong></li>
                <li>Enter the code shown above. Done — your number is connected.</li>
              </ol>
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', background: 'rgba(37,211,102,.04)', border: '1px solid rgba(37,211,102,.12)', borderRadius: '10px', padding: '16px 18px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.7 }}>
          This uses a real WhatsApp connection (no Meta approval), ideal for two-way support chat. For high-volume marketing blasts, the official WhatsApp Cloud API is recommended.
        </div>
      </main>
    </div>
  )
}
