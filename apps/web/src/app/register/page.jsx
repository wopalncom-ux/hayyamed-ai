'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

const INDUSTRIES = [
  'Healthcare & Medical', 'Dental Clinic', 'Beauty & Spa', 'Real Estate',
  'Education & Training', 'Restaurant & Food', 'Legal Services',
  'Automotive', 'Retail & E-commerce', 'Hospitality', 'Other',
]

const COUNTRIES = ['Qatar', 'Saudi Arabia', 'UAE', 'Kuwait', 'Bahrain', 'Oman', 'Egypt', 'Jordan', 'Other']

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

export default function Register() {
  const router = useRouter()
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [orgName,  setOrgName]  = useState('')
  const [phone,    setPhone]    = useState('')
  const [country,  setCountry]  = useState('Qatar')
  const [industry, setIndustry] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [agreed,   setAgreed]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const doRegister = async () => {
    if (!name.trim())            { setError('Full name is required'); return }
    if (!email.trim())           { setError('Email is required'); return }
    if (password.length < 8)     { setError('Password must be at least 8 characters'); return }
    if (!orgName.trim())         { setError('Business name is required'); return }
    if (!agreed)                 { setError('Please accept the terms to continue'); return }

    setLoading(true); setError('')
    try {
      const data = await api.register({
        name:     name.trim(),
        email:    email.trim().toLowerCase(),
        password,
        orgName:  orgName.trim(),
        phone:    phone.trim() || undefined,
        country,
        industry: industry || undefined,
      })

      // Same pattern as login page
      localStorage.setItem('hayyamed_auth', JSON.stringify({
        email:        data.user.email,
        loggedIn:     true,
        accessToken:  data.accessToken,
        refreshToken: data.refreshToken,
        orgId:        data.org?.id,
        userId:       data.user?.id,
        userName:     data.user?.name,
        role:         (data.user?.role || 'admin').toLowerCase(),
      }))
      document.cookie = 'hayyamed_session=1; path=/; max-age=604800; SameSite=Strict'
      router.push('/onboarding')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  const inp = { width: '100%', background: '#111622', border: '1px solid #1e2d42', borderRadius: '8px', padding: '12px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: '10px', color: '#7a8fa6', display: 'block', marginBottom: '6px', letterSpacing: '1px', fontWeight: '700' }

  return (
    <div style={{ background: '#07090f', color: '#e2e8f0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>

        {/* Logo + funnel steps */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '6px' }}>
              Hayya<span style={{ color: '#00e5a0' }}>med</span>{' '}
              <span style={{ color: '#64748b', fontWeight: '400', fontSize: '20px' }}>AI</span>
            </div>
          </a>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>Create your account — free to start</div>
          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
            {['① Register', '② Setup', '③ Launch'].map((s, i) => (
              <div key={s} style={{
                fontSize: '10px', padding: '3px 12px', borderRadius: '12px', fontWeight: i === 0 ? '700' : '400',
                background: i === 0 ? 'rgba(0,229,160,.12)' : '#0c0f1a',
                color: i === 0 ? '#00e5a0' : '#3d4f63',
                border: `1px solid ${i === 0 ? 'rgba(0,229,160,.3)' : '#1a2235'}`,
              }}>{s}</div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#0f1520', border: '1px solid #1e2d42', borderRadius: '12px', padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,.4)' }}>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '6px', color: '#ef4444', fontSize: '12px', marginBottom: '20px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Name + Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={lbl}>YOUR NAME *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doRegister()}
                placeholder="Ahmad Al Rashid" style={inp} />
            </div>
            <div>
              <label style={lbl}>WORK EMAIL *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doRegister()}
                placeholder="you@company.com" style={inp} />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>PASSWORD *</label>
            <div style={{ position: 'relative' }}>
              <input type={showPwd ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doRegister()}
                placeholder="Min 8 characters"
                style={{ ...inp, paddingRight: '44px' }} />
              <span onClick={() => setShowPwd(!showPwd)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '15px', color: '#7a8fa6', userSelect: 'none' }}>
                {showPwd ? '🙈' : '👁'}
              </span>
            </div>
            <PasswordStrength password={password} />
          </div>

          {/* Business name */}
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>BUSINESS / ORGANIZATION NAME *</label>
            <input value={orgName} onChange={e => setOrgName(e.target.value)}
              placeholder="e.g. Bright Smile Dental Clinic" style={inp} />
          </div>

          {/* Country + Industry */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={lbl}>COUNTRY</label>
              <select value={country} onChange={e => setCountry(e.target.value)}
                style={{ ...inp, cursor: 'pointer' }}>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>INDUSTRY</label>
              <select value={industry} onChange={e => setIndustry(e.target.value)}
                style={{ ...inp, cursor: 'pointer' }}>
                <option value="">Select…</option>
                {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '22px' }}>
            <label style={lbl}>PHONE <span style={{ color: '#3d4f63', fontWeight: '400' }}>(optional)</span></label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+974 XXXX XXXX" style={inp} />
          </div>

          {/* Terms */}
          <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '22px' }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: '2px', accentColor: '#00e5a0', flexShrink: 0, width: '15px', height: '15px' }} />
            <span style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.7' }}>
              I agree to the{' '}
              <a href="/terms" target="_blank" style={{ color: '#00e5a0', textDecoration: 'none' }}>Terms of Service</a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" style={{ color: '#00e5a0', textDecoration: 'none' }}>Privacy Policy</a>.
              Your data stays in Qatar (me-central1) — PDPL &amp; GDPR compliant.
            </span>
          </label>

          {/* CTA */}
          <button onClick={doRegister} disabled={loading} style={{
            width: '100%', height: '50px',
            background: loading ? '#1a2235' : 'linear-gradient(135deg,#00e5a0,#00c98a)',
            color: loading ? '#7a8fa6' : '#07090f',
            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '800',
            cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '.3px', transition: 'opacity .15s',
          }}>
            {loading ? 'Creating your account…' : '🚀 Create Account & Continue →'}
          </button>

          {/* Reassurance strip */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px' }}>
            {['✓ Free to start', '✓ No credit card', '✓ 5 min setup'].map(t => (
              <span key={t} style={{ fontSize: '10px', color: '#3d4f63' }}>{t}</span>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: '#3d4f63' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#00e5a0', textDecoration: 'none', fontWeight: '700' }}>Sign in →</Link>
        </div>
      </div>
    </div>
  )
}
