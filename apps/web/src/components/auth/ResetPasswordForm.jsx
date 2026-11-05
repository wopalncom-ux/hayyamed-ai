'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { lp } from '@/lib/i18n'

const T = {
  en: {
    strength: ['', 'Weak', 'Fair', 'Good', 'Strong'],
    errToken: 'Invalid or missing reset token. Please request a new link.',
    errPwd: 'Password must be at least 8 characters', errMatch: 'Passwords do not match',
    errFail: 'Reset failed. The link may have expired — request a new one.',
    doneH: 'Password updated!', doneP: (<>Your password has been reset successfully.<br />Redirecting you to sign in…</>),
    invalidH: 'Invalid Reset Link', invalidP: 'This link is invalid or has expired. Please request a new password reset.',
    requestNew: 'Request New Link →', intro: 'Choose a strong new password for your account.',
    newPwd: 'NEW PASSWORD', newPh: 'Min 8 characters', confirm: 'CONFIRM PASSWORD', confirmPh: 'Re-enter password',
    mismatch: 'Passwords do not match', updating: 'Updating password…', set: 'Set New Password →',
    subtitle: 'Set a new password', loading: 'Loading…', back: '← Back to Sign In', newLink: 'Request new link',
    show: 'Show password', hide: 'Hide password', switchTo: 'العربية',
  },
  ar: {
    strength: ['', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية'],
    errToken: 'رمز إعادة التعيين غير صالح أو مفقود. يُرجى طلب رابط جديد.',
    errPwd: 'يجب ألا تقل كلمة المرور عن 8 أحرف', errMatch: 'كلمتا المرور غير متطابقتين',
    errFail: 'تعذّرت إعادة التعيين، فربما انتهت صلاحية الرابط. يُرجى طلب رابط جديد.',
    doneH: 'تم تحديث كلمة المرور!', doneP: (<>تمت إعادة تعيين كلمة المرور بنجاح.<br />جارٍ تحويلك إلى صفحة تسجيل الدخول…</>),
    invalidH: 'رابط إعادة التعيين غير صالح', invalidP: 'هذا الرابط غير صالح أو انتهت صلاحيته. يُرجى طلب إعادة تعيين جديدة لكلمة المرور.',
    requestNew: 'اطلب رابطاً جديداً ←', intro: 'اختر كلمة مرور جديدة وقوية لحسابك.',
    newPwd: 'كلمة المرور الجديدة', newPh: '8 أحرف على الأقل', confirm: 'تأكيد كلمة المرور', confirmPh: 'أعد إدخال كلمة المرور',
    mismatch: 'كلمتا المرور غير متطابقتين', updating: 'جارٍ تحديث كلمة المرور…', set: 'احفظ كلمة المرور الجديدة ←',
    subtitle: 'تعيين كلمة مرور جديدة', loading: 'جارٍ التحميل…', back: '→ العودة إلى تسجيل الدخول', newLink: 'اطلب رابطاً جديداً',
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

function ResetForm({ locale, t }) {
  const ar = locale === 'ar'
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
    if (!token) setError(t.errToken)
  }, [token, t])

  const submit = async () => {
    if (password.length < 8)      { setError(t.errPwd); return }
    if (password !== confirm)     { setError(t.errMatch); return }
    setLoading(true); setError('')
    try {
      await api.resetPassword(token, password)
      setDone(true)
      setTimeout(() => router.push(lp(locale, '/login')), 3000)
    } catch (err) {
      setError((!ar && err.message) || t.errFail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#0f1520', border: '1px solid #1e2d42', borderRadius: '12px', padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,.4)' }}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
          <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '10px' }}>{t.doneH}</div>
          <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7', marginBottom: '20px' }}>
            {t.doneP}
          </div>
          <div style={{ width: '100%', height: '3px', background: '#1a2235', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#D8B16A', animation: 'grow 3s linear forwards', width: '0%' }} />
          </div>
          <style>{`@keyframes grow { to { width: 100% } }`}</style>
        </div>
      ) : (
        <>
          {!token ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
              <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#ef4444' }}>{t.invalidH}</div>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7', marginBottom: '20px' }}>
                {t.invalidP}
              </div>
              <Link href={lp(locale, '/forgot-password')} style={{ display: 'inline-block', padding: '10px 24px', background: '#D8B16A', borderRadius: '8px', color: '#07090f', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>
                {t.requestNew}
              </Link>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7', marginBottom: '22px' }}>
                {t.intro}
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '6px', color: '#ef4444', fontSize: '12px', marginBottom: '18px' }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label htmlFor="rp-password" style={{ display: 'block', fontSize: ar ? '12px' : '10px', color: '#7a8fa6', marginBottom: '6px', letterSpacing: '1px', fontWeight: '700' }}>{t.newPwd}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="rp-password" autoComplete="new-password"
                    type={showPwd ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    placeholder={t.newPh} autoFocus
                    style={{ width: '100%', background: '#111622', border: '1px solid #1e2d42', borderRadius: '8px', paddingBlock: '12px', paddingInlineStart: '14px', paddingInlineEnd: '44px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <span role="button" tabIndex={0} aria-label={showPwd ? t.hide : t.show} onClick={() => setShowPwd(!showPwd)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setShowPwd(!showPwd)}
                    style={{ position: 'absolute', insetInlineEnd: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '15px', color: '#7a8fa6', userSelect: 'none' }}>
                    {showPwd ? '🙈' : '👁'}
                  </span>
                </div>
                <PasswordStrength password={password} labels={t.strength} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="rp-confirm" style={{ display: 'block', fontSize: ar ? '12px' : '10px', color: '#7a8fa6', marginBottom: '6px', letterSpacing: '1px', fontWeight: '700' }}>{t.confirm}</label>
                <input
                  id="rp-confirm" autoComplete="new-password"
                  type={showPwd ? 'text' : 'password'} value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder={t.confirmPh}
                  style={{
                    width: '100%', background: '#111622',
                    border: `1px solid ${confirm && confirm !== password ? 'rgba(239,68,68,.5)' : '#1e2d42'}`,
                    borderRadius: '8px', padding: '12px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {confirm && confirm !== password && (
                  <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '4px' }}>{t.mismatch}</div>
                )}
              </div>

              <button onClick={submit} disabled={loading || !token} style={{
                width: '100%', height: '46px',
                background: loading ? '#1a2235' : 'linear-gradient(135deg,#D8B16A,#00c98a)',
                color: loading ? '#7a8fa6' : '#07090f',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '800',
                cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '.3px',
              }}>
                {loading ? t.updating : t.set}
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default function ResetPasswordForm({ locale = 'en' }) {
  const t = T[locale] || T.en
  const ar = locale === 'ar'
  return (
    <div style={{ background: '#07090f', color: '#e2e8f0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '24px', position: 'relative' }}>
      <a href={lp(ar ? 'en' : 'ar', '/reset-password')} hrefLang={ar ? 'en' : 'ar'} lang={ar ? 'en' : 'ar'} style={{ position: 'absolute', top: '18px', insetInlineEnd: '24px', fontSize: '13px', fontWeight: 700, color: '#D8B16A', textDecoration: 'none' }}>{t.switchTo}</a>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <a href={lp(locale, '/')} style={{ textDecoration: 'none' }}>
            <div dir="ltr" style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '6px', color: '#e2e8f0' }}>
              Hayya<span style={{ color: '#D8B16A' }}>med</span>{' '}
              <span style={{ color: '#64748b', fontWeight: '400', fontSize: '20px' }}>AI</span>
            </div>
          </a>
          <div style={{ fontSize: '13px', color: '#64748b' }}>{t.subtitle}</div>
        </div>

        <Suspense fallback={<div style={{ background: '#0f1520', border: '1px solid #1e2d42', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#3d4f63', fontSize: '13px' }}>{t.loading}</div>}>
          <ResetForm locale={locale} t={t} />
        </Suspense>

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: '#3d4f63' }}>
          <Link href={lp(locale, '/login')} style={{ color: '#D8B16A', textDecoration: 'none', fontWeight: '700' }}>{t.back}</Link>
          {' · '}
          <Link href={lp(locale, '/forgot-password')} style={{ color: '#64748b', textDecoration: 'none' }}>{t.newLink}</Link>
        </div>
      </div>
    </div>
  )
}
