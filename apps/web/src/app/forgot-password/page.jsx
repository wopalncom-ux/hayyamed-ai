'use client'
import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const submit = async () => {
    if (!email.trim()) { setError('Email is required'); return }
    setLoading(true); setError('')
    try {
      await api.forgotPassword(email.trim().toLowerCase())
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#07090f', color: '#e2e8f0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '6px' }}>
              Hayya<span style={{ color: '#00e5a0' }}>med</span>{' '}
              <span style={{ color: '#64748b', fontWeight: '400', fontSize: '20px' }}>AI</span>
            </div>
          </a>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Reset your password</div>
        </div>

        <div style={{ background: '#0f1520', border: '1px solid #1e2d42', borderRadius: '12px', padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,.4)' }}>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📧</div>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '10px' }}>Check your inbox</div>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7', marginBottom: '24px' }}>
                If <strong style={{ color: '#e2e8f0' }}>{email}</strong> is registered,
                you will receive a password reset link within a few minutes.
                <br /><br />
                Check your spam folder if you don't see it.
              </div>
              <Link href="/login" style={{ display: 'inline-block', padding: '10px 24px', background: 'rgba(0,229,160,.08)', border: '1px solid rgba(0,229,160,.25)', borderRadius: '8px', color: '#00e5a0', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7', marginBottom: '22px' }}>
                Enter the email address linked to your account and we'll send you a link to reset your password.
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '6px', color: '#ef4444', fontSize: '12px', marginBottom: '18px' }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ marginBottom: '22px' }}>
                <div style={{ fontSize: '10px', color: '#7a8fa6', marginBottom: '6px', letterSpacing: '1px', fontWeight: '700' }}>EMAIL ADDRESS</div>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="your@email.com"
                  autoFocus
                  style={{ width: '100%', background: '#111622', border: '1px solid #1e2d42', borderRadius: '8px', padding: '12px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button onClick={submit} disabled={loading} style={{
                width: '100%', height: '46px',
                background: loading ? '#1a2235' : 'linear-gradient(135deg,#00e5a0,#00c98a)',
                color: loading ? '#7a8fa6' : '#07090f',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '800',
                cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '.3px',
              }}>
                {loading ? 'Sending…' : 'Send Reset Link →'}
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: '#3d4f63' }}>
          <Link href="/login" style={{ color: '#00e5a0', textDecoration: 'none', fontWeight: '700' }}>← Back to Sign In</Link>
          {' · '}
          <Link href="/register" style={{ color: '#64748b', textDecoration: 'none' }}>Create account</Link>
        </div>
      </div>
    </div>
  )
}
