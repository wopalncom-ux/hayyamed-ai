'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

import { lp } from '@/lib/i18n'

// Values are sent to the API as-is (English); only the visible labels are translated.
const INDUSTRIES = [
  ['Healthcare & Medical', 'الرعاية الصحية والطبية'], ['Dental Clinic', 'عيادة أسنان'], ['Beauty & Spa', 'التجميل والسبا'],
  ['Real Estate', 'العقارات'], ['Education & Training', 'التعليم والتدريب'], ['Restaurant & Food', 'المطاعم والأغذية'],
  ['Legal Services', 'الخدمات القانونية'], ['Automotive', 'السيارات'], ['Retail & E-commerce', 'التجزئة والتجارة الإلكترونية'],
  ['Hospitality', 'الضيافة'], ['Other', 'أخرى'],
]

const COUNTRIES = [
  ['Qatar', 'قطر'], ['Saudi Arabia', 'السعودية'], ['UAE', 'الإمارات'], ['Kuwait', 'الكويت'], ['Bahrain', 'البحرين'],
  ['Oman', 'عُمان'], ['Egypt', 'مصر'], ['Jordan', 'الأردن'], ['Other', 'أخرى'],
]

const T = {
  en: {
    strength: ['', 'Weak', 'Fair', 'Good', 'Strong'],
    errName: 'Full name is required', errEmail: 'Email is required', errPwd: 'Password must be at least 8 characters',
    errOrg: 'Business name is required', errTerms: 'Please accept the terms to continue', errFail: 'Registration failed. Please try again.',
    subtitle: 'Create your account — free to start', steps: ['① Register', '② Setup', '③ Launch'],
    name: 'YOUR NAME *', namePh: 'Ahmad Al Rashid', email: 'WORK EMAIL *', emailPh: 'you@company.com',
    password: 'PASSWORD *', passwordPh: 'Min 8 characters', org: 'BUSINESS / ORGANIZATION NAME *', orgPh: 'e.g. Bright Smile Dental Clinic',
    country: 'COUNTRY', industry: 'INDUSTRY', select: 'Select…', phone: 'PHONE', optional: '(optional)', phonePh: '+974 XXXX XXXX',
    agree: 'I agree to the', terms: 'Terms of Service', and: 'and', privacy: 'Privacy Policy',
    dataNote: 'Your data stays in Qatar (me-central1) — PDPL & GDPR compliant.',
    creating: 'Creating your account…', create: '🚀 Create Account & Continue →',
    reassure: ['✓ Free to start', '✓ No credit card', '✓ 5 min setup'],
    have: 'Already have an account?', signIn: 'Sign in →',
    show: 'Show password', hide: 'Hide password', switchTo: 'العربية',
  },
  ar: {
    strength: ['', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية'],
    errName: 'الاسم الكامل مطلوب', errEmail: 'البريد الإلكتروني مطلوب', errPwd: 'يجب ألا تقل كلمة المرور عن 8 أحرف',
    errOrg: 'اسم النشاط التجاري مطلوب', errTerms: 'يُرجى الموافقة على الشروط للمتابعة', errFail: 'تعذّر إنشاء الحساب. يُرجى المحاولة مرة أخرى.',
    subtitle: 'أنشئ حسابك، والبداية مجانية', steps: ['① التسجيل', '② الإعداد', '③ الانطلاق'],
    name: 'اسمك *', namePh: 'أحمد الراشد', email: 'البريد الإلكتروني للعمل *', emailPh: 'you@company.com',
    password: 'كلمة المرور *', passwordPh: '8 أحرف على الأقل', org: 'اسم النشاط التجاري أو المؤسسة *', orgPh: 'مثال: عيادة الابتسامة المشرقة لطب الأسنان',
    country: 'الدولة', industry: 'القطاع', select: 'اختر…', phone: 'رقم الهاتف', optional: '(اختياري)', phonePh: '+974 XXXX XXXX',
    agree: 'أوافق على', terms: 'شروط الخدمة', and: 'و', privacy: 'سياسة الخصوصية',
    dataNote: 'تبقى بياناتك في قطر (me‑central1)، بما يتوافق مع قانون حماية خصوصية البيانات الشخصية القطري واللائحة الأوروبية العامة لحماية البيانات (GDPR).',
    creating: 'جارٍ إنشاء حسابك…', create: '🚀 أنشئ الحساب وتابِع ←',
    reassure: ['✓ البداية مجانية', '✓ دون بطاقة ائتمان', '✓ إعداد خلال 5 دقائق'],
    have: 'لديك حساب بالفعل؟', signIn: 'سجّل الدخول ←',
    show: 'إظهار كلمة المرور', hide: 'إخفاء كلمة المرور', switchTo: 'English',
  },
}

function PasswordStrength({ password, labels }) {
  if (!password) return null
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const color = score <= 1 ? '#ef4444' : score === 2 ? '#f97316' : score === 3 ? '#fbbf24' : '#D8B16A'
  const label = labels[score]
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

export default function RegisterForm({ locale = 'en' }) {
  const t = T[locale] || T.en
  const ar = locale === 'ar'
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
    if (!name.trim())            { setError(t.errName); return }
    if (!email.trim())           { setError(t.errEmail); return }
    if (password.length < 8)     { setError(t.errPwd); return }
    if (!orgName.trim())         { setError(t.errOrg); return }
    if (!agreed)                 { setError(t.errTerms); return }

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
      setError((!ar && err.message) || t.errFail)
      setLoading(false)
    }
  }

  const ltr = { direction: 'ltr', textAlign: ar ? 'right' : 'left' }
  const inp = { width: '100%', background: '#111622', border: '1px solid #1e2d42', borderRadius: '8px', padding: '12px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: ar ? '12px' : '10px', color: '#7a8fa6', display: 'block', marginBottom: '6px', letterSpacing: '1px', fontWeight: '700' }

  return (
    <div style={{ background: '#07090f', color: '#e2e8f0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '24px', position: 'relative' }}>
      <a href={lp(ar ? 'en' : 'ar', '/register')} hrefLang={ar ? 'en' : 'ar'} lang={ar ? 'en' : 'ar'} style={{ position: 'absolute', top: '18px', insetInlineEnd: '24px', fontSize: '13px', fontWeight: 700, color: '#D8B16A', textDecoration: 'none' }}>{t.switchTo}</a>
      <div style={{ width: '100%', maxWidth: '500px' }}>

        {/* Logo + funnel steps */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <a href={lp(locale, '/')} style={{ textDecoration: 'none' }}>
            <div dir="ltr" style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '6px', color: '#e2e8f0' }}>
              Hayya<span style={{ color: '#D8B16A' }}>med</span>{' '}
              <span style={{ color: '#64748b', fontWeight: '400', fontSize: '20px' }}>AI</span>
            </div>
          </a>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>{t.subtitle}</div>
          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
            {t.steps.map((s, i) => (
              <div key={s} style={{
                fontSize: ar ? '12px' : '10px', padding: '3px 12px', borderRadius: '12px', fontWeight: i === 0 ? '700' : '400',
                background: i === 0 ? 'rgba(216,177,106,.12)' : '#0c0f1a',
                color: i === 0 ? '#D8B16A' : '#3d4f63',
                border: `1px solid ${i === 0 ? 'rgba(216,177,106,.3)' : '#1a2235'}`,
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label htmlFor="reg-name" style={lbl}>{t.name}</label>
              <input id="reg-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doRegister()}
                placeholder={t.namePh} style={inp} />
            </div>
            <div>
              <label htmlFor="reg-email" style={lbl}>{t.email}</label>
              <input id="reg-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doRegister()}
                placeholder={t.emailPh} style={{ ...inp, ...ltr }} />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '14px' }}>
            <label htmlFor="reg-password" style={lbl}>{t.password}</label>
            <div style={{ position: 'relative' }}>
              <input id="reg-password" type={showPwd ? 'text' : 'password'} autoComplete="new-password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doRegister()}
                placeholder={t.passwordPh}
                style={{ ...inp, paddingInlineEnd: '44px' }} />
              <span role="button" tabIndex={0} aria-label={showPwd ? t.hide : t.show} onClick={() => setShowPwd(!showPwd)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setShowPwd(!showPwd)}
                style={{ position: 'absolute', insetInlineEnd: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '15px', color: '#7a8fa6', userSelect: 'none' }}>
                {showPwd ? '🙈' : '👁'}
              </span>
            </div>
            <PasswordStrength password={password} labels={t.strength} />
          </div>

          {/* Business name */}
          <div style={{ marginBottom: '14px' }}>
            <label htmlFor="reg-org" style={lbl}>{t.org}</label>
            <input id="reg-org" autoComplete="organization" value={orgName} onChange={e => setOrgName(e.target.value)}
              placeholder={t.orgPh} style={inp} />
          </div>

          {/* Country + Industry */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label htmlFor="reg-country" style={lbl}>{t.country}</label>
              <select id="reg-country" value={country} onChange={e => setCountry(e.target.value)}
                style={{ ...inp, cursor: 'pointer' }}>
                {COUNTRIES.map(([value, arLabel]) => <option key={value} value={value}>{ar ? arLabel : value}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="reg-industry" style={lbl}>{t.industry}</label>
              <select id="reg-industry" value={industry} onChange={e => setIndustry(e.target.value)}
                style={{ ...inp, cursor: 'pointer' }}>
                <option value="">{t.select}</option>
                {INDUSTRIES.map(([value, arLabel]) => <option key={value} value={value}>{ar ? arLabel : value}</option>)}
              </select>
            </div>
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '22px' }}>
            <label htmlFor="reg-phone" style={lbl}>{t.phone} <span style={{ color: '#3d4f63', fontWeight: '400' }}>{t.optional}</span></label>
            <input id="reg-phone" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder={t.phonePh} style={{ ...inp, ...ltr }} />
          </div>

          {/* Terms */}
          <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '22px' }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: '2px', accentColor: '#D8B16A', flexShrink: 0, width: '15px', height: '15px' }} />
            <span style={{ fontSize: ar ? '12px' : '11px', color: '#64748b', lineHeight: '1.7' }}>
              {t.agree}{' '}
              <a href={lp(locale, '/terms')} target="_blank" style={{ color: '#D8B16A', textDecoration: 'none' }}>{t.terms}</a>{' '}
              {t.and}{ar ? '' : ' '}
              <a href={lp(locale, '/privacy')} target="_blank" style={{ color: '#D8B16A', textDecoration: 'none' }}>{t.privacy}</a>.
              {' '}{t.dataNote}
            </span>
          </label>

          {/* CTA */}
          <button onClick={doRegister} disabled={loading} style={{
            width: '100%', height: '50px',
            background: loading ? '#1a2235' : 'linear-gradient(135deg,#D8B16A,#00c98a)',
            color: loading ? '#7a8fa6' : '#07090f',
            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '800',
            cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '.3px', transition: 'opacity .15s',
          }}>
            {loading ? t.creating : t.create}
          </button>

          {/* Reassurance strip */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px' }}>
            {t.reassure.map(r => (
              <span key={r} style={{ fontSize: ar ? '12px' : '10px', color: '#3d4f63' }}>{r}</span>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: '#3d4f63' }}>
          {t.have}{' '}
          <Link href={lp(locale, '/login')} style={{ color: '#D8B16A', textDecoration: 'none', fontWeight: '700' }}>{t.signIn}</Link>
        </div>
      </div>
    </div>
  )
}
