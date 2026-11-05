'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { normalizeRole } from '@/lib/auth'
import { lp } from '@/lib/i18n'

const T = {
  en: {
    fill: 'Please fill in all fields', invalid: 'Invalid email or password',
    subtitle: 'Sign in to your account', email: 'EMAIL ADDRESS', password: 'PASSWORD',
    forgot: 'Forgot password?', signingIn: 'Signing in…', signIn: 'Sign In →',
    newHere: 'New here?', create: 'Create a free account →',
    owned: 'Owned and managed by Hayya Med AI · Doha, Qatar 🇶🇦',
    show: 'Show password', hide: 'Hide password', switchTo: 'العربية',
  },
  ar: {
    fill: 'يُرجى تعبئة جميع الحقول', invalid: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    subtitle: 'سجّل الدخول إلى حسابك', email: 'البريد الإلكتروني', password: 'كلمة المرور',
    forgot: 'نسيت كلمة المرور؟', signingIn: 'جارٍ تسجيل الدخول…', signIn: 'تسجيل الدخول ←',
    newHere: 'مستخدم جديد؟', create: 'أنشئ حساباً مجانياً ←',
    owned: 'تملكها وتديرها شركة هيّا ميد للذكاء الاصطناعي · الدوحة، قطر 🇶🇦',
    show: 'إظهار كلمة المرور', hide: 'إخفاء كلمة المرور', switchTo: 'English',
  },
}

export default function LoginForm({ locale = 'en' }) {
  const t = T[locale] || T.en
  const ar = locale === 'ar'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)

  const doLogin = async () => {
    const em = email.trim()
    const pw = password
    if (!em || !pw) { setError(t.fill); return }
    setLoading(true); setError('')

    try {
      const data = await api.login(em, pw)
      const role = normalizeRole(data.user?.role || 'manager')
      localStorage.setItem('hayyamed_auth', JSON.stringify({
        email: em, loggedIn: true,
        accessToken:  data.accessToken,
        refreshToken: data.refreshToken,
        orgId:    data.org?.id,
        userId:   data.user?.id,
        userName: data.user?.name,
        role,
      }))
      document.cookie = 'hayyamed_session=1; path=/; max-age=604800; SameSite=Strict'
      window.location.href = role === 'client' ? '/client' : '/dashboard'
    } catch {
      setError(t.invalid)
      setLoading(false)
    }
  }

  return (
    <div style={{position:'relative', background:'#07090f', color:'#e2e8f0', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif', padding:'20px'}}>
      <a href={lp(ar ? 'en' : 'ar', '/login')} hrefLang={ar ? 'en' : 'ar'} lang={ar ? 'en' : 'ar'} style={{position:'absolute', top:'18px', insetInlineEnd:'24px', fontSize:'13px', fontWeight:700, color:'#D8B16A', textDecoration:'none'}}>{t.switchTo}</a>
      <div style={{width:'100%', maxWidth:'460px'}}>

        {/* Logo */}
        <div style={{textAlign:'center', marginBottom:'36px'}}>
          <div dir="ltr" style={{fontSize:'32px', fontWeight:'900', letterSpacing:'-1px', marginBottom:'8px'}}>
            Hayya<span style={{color:'#D8B16A'}}> AI</span>
          </div>
          <div style={{fontSize:'13px', color:'#7a8fa6'}}>{t.subtitle}</div>
        </div>

        {/* Login card */}
        <div style={{background:'#0f1520', border:'1px solid #1e2d42', padding:'32px', borderRadius:'12px', marginBottom:'20px', boxShadow:'0 24px 60px rgba(0,0,0,.4)'}}>

          {error && (
            <div style={{padding:'10px 14px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'6px', color:'#ef4444', fontSize:'12px', marginBottom:'18px'}}>
              ⚠️ {error}
            </div>
          )}

          <div style={{marginBottom:'16px'}}>
            <label htmlFor="login-email" style={{display:'block', fontSize: ar ? '12px' : '10px', color:'#7a8fa6', marginBottom:'6px', letterSpacing:'1px'}}>{t.email}</label>
            <input id="login-email" type="email" dir="ltr" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key==='Enter' && doLogin()}
              placeholder="your@email.com"
              style={{width:'100%', background:'#111622', border:'1px solid #1e2d42', borderRadius:'8px', padding:'12px 14px', textAlign: ar ? 'right' : 'left', color:'#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box'}}/>
          </div>

          <div style={{marginBottom:'26px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'6px'}}>
              <label htmlFor="login-password" style={{fontSize: ar ? '12px' : '10px', color:'#7a8fa6', letterSpacing:'1px'}}>{t.password}</label>
              <a href={lp(locale, '/forgot-password')} style={{fontSize: ar ? '12px' : '11px', color:'#D8B16A', textDecoration:'none'}}>{t.forgot}</a>
            </div>
            <div style={{position:'relative'}}>
              <input id="login-password" type={showPwd ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key==='Enter' && doLogin()}
                placeholder="••••••••"
                style={{width:'100%', background:'#111622', border:'1px solid #1e2d42', borderRadius:'8px', paddingBlock:'12px', paddingInlineStart:'14px', paddingInlineEnd:'42px', color:'#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box'}}/>
              <span role="button" tabIndex={0} aria-label={showPwd ? t.hide : t.show} onClick={() => setShowPwd(!showPwd)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setShowPwd(!showPwd)}
                style={{position:'absolute', insetInlineEnd:'12px', top:'50%', transform:'translateY(-50%)', cursor:'pointer', fontSize:'14px', color:'#7a8fa6', userSelect:'none'}}>
                {showPwd ? '🙈' : '👁'}
              </span>
            </div>
          </div>

          <button onClick={() => doLogin()} disabled={loading}
            style={{width:'100%', height:'46px', background: loading ? '#1a2235' : 'linear-gradient(135deg,#D8B16A,#00c98a)', color: loading ? '#7a8fa6' : '#07090f', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'800', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing:'.3px', transition:'opacity .15s'}}>
            {loading ? t.signingIn : t.signIn}
          </button>
        </div>

        <div style={{textAlign:'center', marginTop:'16px', fontSize:'12px', color:'#3d4f63'}}>
          {t.newHere}{' '}
          <a href={lp(locale, '/register')} style={{color:'#D8B16A', textDecoration:'none', fontWeight:'700'}}>{t.create}</a>
        </div>
        <div style={{textAlign:'center', marginTop:'8px', fontSize:'11px', color:'#3d4f63', lineHeight:'1.7'}}>
          {t.owned}
        </div>
      </div>
    </div>
  )
}
