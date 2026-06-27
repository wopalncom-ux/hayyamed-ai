'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { normalizeRole } from '@/lib/auth'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)

  const doLogin = async () => {
    const em = email.trim()
    const pw = password
    if (!em || !pw) { setError('Please fill in all fields'); return }
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
      setError('Invalid email or password')
      setLoading(false)
    }
  }

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif', padding:'20px'}}>
      <div style={{width:'100%', maxWidth:'460px'}}>

        {/* Logo */}
        <div style={{textAlign:'center', marginBottom:'36px'}}>
          <div style={{fontSize:'32px', fontWeight:'900', letterSpacing:'-1px', marginBottom:'8px'}}>
            Hayya<span style={{color:'#00e5a0'}}> AI</span>
          </div>
          <div style={{fontSize:'13px', color:'#7a8fa6'}}>Sign in to your account</div>
        </div>

        {/* Login card */}
        <div style={{background:'#0f1520', border:'1px solid #1e2d42', padding:'32px', borderRadius:'12px', marginBottom:'20px', boxShadow:'0 24px 60px rgba(0,0,0,.4)'}}>

          {error && (
            <div style={{padding:'10px 14px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'6px', color:'#ef4444', fontSize:'12px', marginBottom:'18px'}}>
              ⚠️ {error}
            </div>
          )}

          <div style={{marginBottom:'16px'}}>
            <div style={{fontSize:'10px', color:'#7a8fa6', marginBottom:'6px', letterSpacing:'1px'}}>EMAIL ADDRESS</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key==='Enter' && doLogin()}
              placeholder="your@email.com"
              style={{width:'100%', background:'#111622', border:'1px solid #1e2d42', borderRadius:'8px', padding:'12px 14px', color:'#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box'}}/>
          </div>

          <div style={{marginBottom:'26px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'6px'}}>
              <div style={{fontSize:'10px', color:'#7a8fa6', letterSpacing:'1px'}}>PASSWORD</div>
              <a href="/forgot-password" style={{fontSize:'11px', color:'#00e5a0', textDecoration:'none'}}>Forgot password?</a>
            </div>
            <div style={{position:'relative'}}>
              <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key==='Enter' && doLogin()}
                placeholder="••••••••"
                style={{width:'100%', background:'#111622', border:'1px solid #1e2d42', borderRadius:'8px', padding:'12px 42px 12px 14px', color:'#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box'}}/>
              <span onClick={() => setShowPwd(!showPwd)}
                style={{position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', cursor:'pointer', fontSize:'14px', color:'#7a8fa6', userSelect:'none'}}>
                {showPwd ? '🙈' : '👁'}
              </span>
            </div>
          </div>

          <button onClick={() => doLogin()} disabled={loading}
            style={{width:'100%', height:'46px', background: loading ? '#1a2235' : 'linear-gradient(135deg,#00e5a0,#00c98a)', color: loading ? '#7a8fa6' : '#07090f', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'800', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing:'.3px', transition:'opacity .15s'}}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </div>

        <div style={{textAlign:'center', marginTop:'16px', fontSize:'12px', color:'#3d4f63'}}>
          New here?{' '}
          <a href="/register" style={{color:'#00e5a0', textDecoration:'none', fontWeight:'700'}}>Create a free account →</a>
        </div>
        <div style={{textAlign:'center', marginTop:'8px', fontSize:'11px', color:'#3d4f63', lineHeight:'1.7'}}>
          Owned and managed by Hayya Med AI · Doha, Qatar 🇶🇦
        </div>
      </div>
    </div>
  )
}
