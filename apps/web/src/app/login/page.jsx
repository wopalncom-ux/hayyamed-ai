'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { DEMO_USERS, ROLE_LABELS } from '@/lib/auth'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)

  const doLogin = async (e, p) => {
    const em = e || email
    const pw = p || password
    if (!em || !pw) { setError('Please fill in all fields'); return }
    setLoading(true); setError('')

    // Try real backend first
    try {
      const data = await api.login(em, pw)
      const demoMatch = DEMO_USERS.find(u => u.email === em)
      const role = data.user?.role || demoMatch?.role || 'manager'
      localStorage.setItem('hayyamed_auth', JSON.stringify({
        email: em, loggedIn: true,
        accessToken:  data.accessToken,
        refreshToken: data.refreshToken,
        orgId:    data.org?.id  || demoMatch?.orgId,
        userId:   data.user?.id,
        userName: data.user?.name || demoMatch?.name,
        role,
      }))
      window.location.href = role === 'client' ? '/client' : '/dashboard'
      return
    } catch {}

    // Fallback: demo credentials
    const user = DEMO_USERS.find(u => u.email === em && u.password === pw)
    if (user) {
      localStorage.setItem('hayyamed_auth', JSON.stringify({
        email: em, loggedIn: true,
        orgId: user.orgId, userName: user.name, role: user.role,
      }))
      window.location.href = user.role === 'client' ? '/client' : '/dashboard'
    } else {
      setError('Invalid email or password')
      setLoading(false)
    }
  }

  const quickLogin = (user) => {
    setEmail(user.email)
    setPassword(user.password)
    doLogin(user.email, user.password)
  }

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif', padding:'20px'}}>
      <div style={{width:'100%', maxWidth:'460px'}}>

        {/* Logo */}
        <div style={{textAlign:'center', marginBottom:'36px'}}>
          <div style={{fontSize:'32px', fontWeight:'900', letterSpacing:'-1px', marginBottom:'8px'}}>
            Hayya<span style={{color:'#00e5a0'}}>med</span> AI
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
            <div style={{fontSize:'10px', color:'#7a8fa6', marginBottom:'6px', letterSpacing:'1px'}}>PASSWORD</div>
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

        {/* Quick login cards */}
        <div style={{marginBottom:'6px'}}>
          <div style={{fontSize:'10px', color:'#3d4f63', letterSpacing:'2px', textAlign:'center', marginBottom:'12px'}}>QUICK ACCESS — CLICK TO LOGIN</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
            {DEMO_USERS.map(u => {
              const rl = ROLE_LABELS[u.role]
              const initials = u.name.split(' ').map(n=>n[0]).join('').slice(0,2)
              return (
                <button key={u.email} onClick={() => quickLogin(u)}
                  style={{background:'#0f1520', border:`1px solid ${rl.color}30`, borderRadius:'10px', padding:'14px', cursor:'pointer', textAlign:'left', transition:'all .15s', outline:'none'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px'}}>
                    <div style={{width:'34px', height:'34px', borderRadius:'50%', background:`${rl.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'800', color:rl.color, flexShrink:0}}>{initials}</div>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:'12px', fontWeight:'800', color:'#e2e8f0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{u.name}</div>
                      <div style={{fontSize:'10px', color:rl.color, fontWeight:'600'}}>{rl.label}</div>
                    </div>
                  </div>
                  <div style={{fontSize:'10px', color:'#3d4f63', marginBottom:'2px'}}>📧 {u.email}</div>
                  <div style={{fontSize:'10px', color:'#3d4f63'}}>🔑 {u.password}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div style={{textAlign:'center', marginTop:'18px', fontSize:'11px', color:'#3d4f63'}}>
          Powered by Hayyamed AI · Qatar 🇶🇦
        </div>
      </div>
    </div>
  )
}
