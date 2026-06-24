'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

function PasswordStrength({ password }) {
  if (!password) return null
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const color = score <= 1 ? '#ef4444' : score === 2 ? '#f97316' : score === 3 ? '#fbbf24' : '#00e5a0'
  const label = ['', 'Weak', 'Fair', 'Good', 'Strong'][score]
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '3px', marginBottom: '3px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i < score ? color : '#1a2235', transition: 'background .2s' }} />
        ))}
      </div>
      <div style={{ fontSize: '10px', color: score > 0 ? color : '#3d4f63' }}>{label}</div>
    </div>
  )
}

function ResetForm() {
  const router      = useRouter()
  const params      = useSearchParams()
  const token       = params.get('token') || ''
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (!token) setError('Invalid or missing reset token. Please request a new link.')
  }, [token])

  const submit = async () => {
    if (password.length < 8)      { setError('Password must be at least 8 characters'); return }
    if (password !== confirm)     { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    try {
      await api.resetPassword(token, password)
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      setError(err.message || 'Reset failed. The link may have expired — request a new one.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#0f1520', border: '1px solid #1e2d42', borderRadius: '12px', padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,.4)' }}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
          <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '10px' }}>Password updated!</div>
          <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7', marginBottom: '20px' }}>
            Your password has been reset successfully.<br />
            Redirecting you to sign in…
          </div>
          <div style={{ width: '100%', height: '3px', background: '#1a2235', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#00e5a0', animation: 'grow 3s linear forwards', width: '0%' }} />
          </div>
          <style>{`@keyframes grow { to { width: 100% } }`}</style>
        </div>
      ) : (
        <>
          {!token ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
              <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#ef4444' }}>Invalid Reset Link</div>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7', marginBottom: '20px' }}>
                This link is invalid or has expired. Please request a new password reset.
              </div>
              <Link href="/forgot-password" style={{ display: 'inline-block', padding: '10px 24px', background: '#00e5a0', borderRadius: '8px', color: '#07090f', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>
                Request New Link →
              </Link>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7', marginBottom: '22px' }}>
                Choose a strong new password for your account.
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '6px', color: '#ef4444', fontSize: '12px', marginBottom: '18px' }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', color: '#7a8fa6', marginBottom: '6px', letterSpacing: '1px', fontWeight: '700' }}>NEW PASSWORD</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    placeholder="Min 8 characters" autoFocus
                    style={{ width: '100%', background: '#111622', border: '1px solid #1e2d42', borderRadius: '8px', padding: '12px 44px 12px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <span onClick={() => setShowPwd(!showPwd)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '15px', color: '#7a8fa6', userSelect: 'none' }}>
                    {showPwd ? '🙈' : '👁'}
                  </span>
                </div>
                <PasswordStrength password={password} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '10px', color: '#7a8fa6', marginBottom: '6px', letterSpacing: '1px', fontWeight: '700' }}>CONFIRM PASSWORD</div>
                <input
                  type={showPwd ? 'text' : 'password'} value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="Re-enter password"
                  style={{
                    width: '100%', background: '#111622',
                    border: `1px solid ${confirm && confirm !== password ? 'rgba(239,68,68,.5)' : '#1e2d42'}`,
                    borderRadius: '8px', padding: '12px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {confirm && confirm !== password && (
                  <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '4px' }}>Passwords do not match</div>
                )}
              </div>

              <button onClick={submit} disabled={loading || !token} style={{
                width: '100%', height: '46px',
                background: loading ? '#1a2235' : 'linear-gradient(135deg,#00e5a0,#00c98a)',
                color: loading ? '#7a8fa6' : '#07090f',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '800',
                cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '.3px',
              }}>
                {loading ? 'Updating password…' : 'Set New Password →'}
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default function ResetPassword() {
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
          <div style={{ fontSize: '13px', color: '#64748b' }}>Set a new password</div>
        </div>

        <Suspense fallback={<div style={{ background: '#0f1520', border: '1px solid #1e2d42', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#3d4f63', fontSize: '13px' }}>Loading…</div>}>
          <ResetForm />
        </Suspense>

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: '#3d4f63' }}>
          <Link href="/login" style={{ color: '#00e5a0', textDecoration: 'none', fontWeight: '700' }}>← Back to Sign In</Link>
          {' · '}
          <Link href="/forgot-password" style={{ color: '#64748b', textDecoration: 'none' }}>Request new link</Link>
        </div>
      </div>
    </div>
  )
}
