'use client'
import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { lp } from '@/lib/i18n'

const T = {
  en: {
    errEmail: 'Email is required', errGeneric: 'Something went wrong. Please try again.',
    subtitle: 'Reset your password', checkH: 'Check your inbox',
    checkP: (e) => (<>If <strong style={{ color: '#e2e8f0' }}>{e}</strong> is registered, you will receive a password reset link within a few minutes.<br /><br />Check your spam folder if you don't see it.</>),
    back: '← Back to Sign In', intro: "Enter the email address linked to your account and we'll send you a link to reset your password.",
    email: 'EMAIL ADDRESS', sending: 'Sending…', send: 'Send Reset Link →', create: 'Create account', switchTo: 'العربية',
  },
  ar: {
    errEmail: 'البريد الإلكتروني مطلوب', errGeneric: 'حدث خطأ ما. يُرجى المحاولة مرة أخرى.',
    subtitle: 'إعادة تعيين كلمة المرور', checkH: 'تحقّق من بريدك الوارد',
    checkP: (e) => (<>إذا كان البريد <strong dir="ltr" style={{ color: '#e2e8f0' }}>{e}</strong> مسجّلاً لدينا، فستصلك رسالة تتضمّن رابط إعادة تعيين كلمة المرور خلال دقائق.<br /><br />إذا لم تجدها، فتحقّق من مجلد الرسائل غير المرغوب فيها.</>),
    back: '→ العودة إلى تسجيل الدخول', intro: 'أدخل البريد الإلكتروني المرتبط بحسابك، وسنرسل إليك رابطاً لإعادة تعيين كلمة المرور.',
    email: 'البريد الإلكتروني', sending: 'جارٍ الإرسال…', send: 'أرسل رابط إعادة التعيين ←', create: 'إنشاء حساب', switchTo: 'English',
  },
}

export default function ForgotPasswordForm({ locale = 'en' }) {
  const t = T[locale] || T.en
  const ar = locale === 'ar'
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const submit = async () => {
    if (!email.trim()) { setError(t.errEmail); return }
    setLoading(true); setError('')
    try {
      await api.forgotPassword(email.trim().toLowerCase())
      setSent(true)
    } catch (err) {
      setError((!ar && err.message) || t.errGeneric)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#07090f', color: '#e2e8f0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '24px', position: 'relative' }}>
      <a href={lp(ar ? 'en' : 'ar', '/forgot-password')} hrefLang={ar ? 'en' : 'ar'} lang={ar ? 'en' : 'ar'} style={{ position: 'absolute', top: '18px', insetInlineEnd: '24px', fontSize: '13px', fontWeight: 700, color: '#D8B16A', textDecoration: 'none' }}>{t.switchTo}</a>
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

        <div style={{ background: '#0f1520', border: '1px solid #1e2d42', borderRadius: '12px', padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,.4)' }}>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📧</div>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '10px' }}>{t.checkH}</div>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7', marginBottom: '24px' }}>
                {t.checkP(email)}
              </div>
              <Link href={lp(locale, '/login')} style={{ display: 'inline-block', padding: '10px 24px', background: 'rgba(216,177,106,.08)', border: '1px solid rgba(216,177,106,.25)', borderRadius: '8px', color: '#D8B16A', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>
                {t.back}
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

              <div style={{ marginBottom: '22px' }}>
                <label htmlFor="fp-email" style={{ display: 'block', fontSize: ar ? '12px' : '10px', color: '#7a8fa6', marginBottom: '6px', letterSpacing: '1px', fontWeight: '700' }}>{t.email}</label>
                <input
                  id="fp-email" dir="ltr" autoComplete="email"
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="your@email.com"
                  autoFocus
                  style={{ width: '100%', background: '#111622', border: '1px solid #1e2d42', borderRadius: '8px', padding: '12px 14px', textAlign: ar ? 'right' : 'left', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button onClick={submit} disabled={loading} style={{
                width: '100%', height: '46px',
                background: loading ? '#1a2235' : 'linear-gradient(135deg,#D8B16A,#00c98a)',
                color: loading ? '#7a8fa6' : '#07090f',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '800',
                cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '.3px',
              }}>
                {loading ? t.sending : t.send}
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: '#3d4f63' }}>
          <Link href={lp(locale, '/login')} style={{ color: '#D8B16A', textDecoration: 'none', fontWeight: '700' }}>{t.back}</Link>
          {' · '}
          <Link href={lp(locale, '/register')} style={{ color: '#64748b', textDecoration: 'none' }}>{t.create}</Link>
        </div>
      </div>
    </div>
  )
}
