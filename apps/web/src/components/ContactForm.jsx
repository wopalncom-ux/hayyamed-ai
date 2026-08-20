'use client'

import { useState } from 'react'

const GOLD = '#D8B16A'
const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: '8px', fontSize: '14px',
  background: '#0c0f1a', border: '1px solid #1a2235', color: '#e2e8f0', outline: 'none',
}
const label = { display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch(`${BASE}/api/v1/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Failed to send. Please try again.')
      setStatus('success')
      setForm({ name: '', email: '', phone: '', company: '', message: '' })
    } catch (err) {
      setStatus('error')
      setErrorMsg(err?.message || 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: '40px', marginBottom: '14px' }}>✅</div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>Message sent!</h3>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 20px' }}>Thanks for reaching out — we'll respond within 1 business day.</p>
        <button onClick={() => setStatus('idle')} style={{ padding: '10px 22px', background: GOLD, border: 'none', borderRadius: '8px', color: '#070b0a', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>Send another message</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div>
          <label style={label}>Full name *</label>
          <input required style={inputStyle} value={form.name} onChange={set('name')} placeholder="Your name" />
        </div>
        <div>
          <label style={label}>Email *</label>
          <input required type="email" style={inputStyle} value={form.email} onChange={set('email')} placeholder="you@company.com" />
        </div>
        <div>
          <label style={label}>Phone</label>
          <input style={inputStyle} value={form.phone} onChange={set('phone')} placeholder="+974 XXXX XXXX" />
        </div>
        <div>
          <label style={label}>Company</label>
          <input style={inputStyle} value={form.company} onChange={set('company')} placeholder="Company name" />
        </div>
      </div>
      <div>
        <label style={label}>Message *</label>
        <textarea required rows={5} style={{ ...inputStyle, resize: 'vertical' }} value={form.message} onChange={set('message')} placeholder="Tell us about your business and what you'd like help with…" />
      </div>
      {status === 'error' && (
        <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#fca5a5', fontSize: '13px' }}>{errorMsg}</div>
      )}
      <button type="submit" disabled={status === 'loading'} style={{ padding: '14px 28px', background: GOLD, border: 'none', borderRadius: '8px', color: '#070b0a', fontWeight: 800, fontSize: '14px', cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}>
        {status === 'loading' ? 'Sending…' : 'Send message →'}
      </button>
      <p style={{ fontSize: '11px', color: '#475569', textAlign: 'center', margin: 0 }}>We respond to all inquiries within 1 business day.</p>
    </form>
  )
}
