'use client'

import { useState } from 'react'

const GOLD = '#D8B16A'
const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: '8px', fontSize: '14px',
  background: '#0c0f1a', border: '1px solid #1a2235', color: '#e2e8f0', outline: 'none',
}
const label = { display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const T = {
  en: {
    failed: 'Failed to send. Please try again.', generic: 'Something went wrong. Please try again.',
    sentH: 'Message sent!', sentP: "Thanks for reaching out — we'll respond within 1 business day.", another: 'Send another message',
    name: 'Full name *', namePh: 'Your name', email: 'Email *', emailPh: 'you@company.com',
    phone: 'Phone', phonePh: '+974 XXXX XXXX', company: 'Company', companyPh: 'Company name',
    message: 'Message *', messagePh: "Tell us about your business and what you'd like help with…",
    sending: 'Sending…', send: 'Send message →', note: 'We respond to all inquiries within 1 business day.',
  },
  ar: {
    failed: 'تعذّر الإرسال. يُرجى المحاولة مرة أخرى.', generic: 'حدث خطأ ما. يُرجى المحاولة مرة أخرى.',
    sentH: 'تم إرسال رسالتك!', sentP: 'شكراً لتواصلك معنا، سنردّ عليك خلال يوم عمل واحد.', another: 'إرسال رسالة أخرى',
    name: 'الاسم الكامل *', namePh: 'اسمك', email: 'البريد الإلكتروني *', emailPh: 'you@company.com',
    phone: 'رقم الهاتف', phonePh: '+974 XXXX XXXX', company: 'الشركة', companyPh: 'اسم الشركة',
    message: 'الرسالة *', messagePh: 'حدّثنا عن نشاطك التجاري وكيف يمكننا مساعدتك…',
    sending: 'جارٍ الإرسال…', send: 'أرسل الرسالة ←', note: 'نردّ على جميع الاستفسارات خلال يوم عمل واحد.',
  },
}

export default function ContactForm({ locale = 'en' }) {
  const t = T[locale] || T.en
  const ar = locale === 'ar'
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
      if (!res.ok) throw new Error((!ar && data?.message) || t.failed)
      setStatus('success')
      setForm({ name: '', email: '', phone: '', company: '', message: '' })
    } catch (err) {
      setStatus('error')
      setErrorMsg(err?.message || t.generic)
    }
  }

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: '40px', marginBottom: '14px' }}>✅</div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>{t.sentH}</h3>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 20px' }}>{t.sentP}</p>
        <button onClick={() => setStatus('idle')} style={{ padding: '10px 22px', background: GOLD, border: 'none', borderRadius: '8px', color: '#070b0a', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>{t.another}</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div>
          <label htmlFor="cf-name" style={label}>{t.name}</label>
          <input id="cf-name" required autoComplete="name" style={inputStyle} value={form.name} onChange={set('name')} placeholder={t.namePh} />
        </div>
        <div>
          <label htmlFor="cf-email" style={label}>{t.email}</label>
          <input id="cf-email" required type="email" dir="ltr" autoComplete="email" style={{ ...inputStyle, textAlign: ar ? 'right' : 'left' }} value={form.email} onChange={set('email')} placeholder={t.emailPh} />
        </div>
        <div>
          <label htmlFor="cf-phone" style={label}>{t.phone}</label>
          <input id="cf-phone" type="tel" dir="ltr" autoComplete="tel" style={{ ...inputStyle, textAlign: ar ? 'right' : 'left' }} value={form.phone} onChange={set('phone')} placeholder={t.phonePh} />
        </div>
        <div>
          <label htmlFor="cf-company" style={label}>{t.company}</label>
          <input id="cf-company" autoComplete="organization" style={inputStyle} value={form.company} onChange={set('company')} placeholder={t.companyPh} />
        </div>
      </div>
      <div>
        <label htmlFor="cf-message" style={label}>{t.message}</label>
        <textarea id="cf-message" required rows={5} style={{ ...inputStyle, resize: 'vertical' }} value={form.message} onChange={set('message')} placeholder={t.messagePh} />
      </div>
      {status === 'error' && (
        <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#fca5a5', fontSize: '13px' }}>{errorMsg}</div>
      )}
      <button type="submit" disabled={status === 'loading'} style={{ padding: '14px 28px', background: GOLD, border: 'none', borderRadius: '8px', color: '#070b0a', fontWeight: 800, fontSize: '14px', cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}>
        {status === 'loading' ? t.sending : t.send}
      </button>
      <p style={{ fontSize: '11px', color: '#475569', textAlign: 'center', margin: 0 }}>{t.note}</p>
    </form>
  )
}
