'use client'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')

    // Simple auth check
    const validUsers = [
      { email:'admin@hayyamed.ai', password:'hayyamed2024' },
      { email:'agent@hayyamed.ai', password:'agent2024' },
    ]

    const user = validUsers.find(u => u.email === email && u.password === password)

    if (user) {
      localStorage.setItem('hayyamed_auth', JSON.stringify({ email, loggedIn: true }))
      window.location.href = '/dashboard'
    } else {
      setError('Invalid email or password')
      setLoading(false)
    }
  }

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif'}}>
      <div style={{width:'100%', maxWidth:'400px', padding:'0 20px'}}>

        <div style={{textAlign:'center', marginBottom:'40px'}}>
          <div style={{fontSize:'28px', fontWeight:'800', marginBottom:'8px'}}>
            Hayya<span style={{color:'#00e5a0'}}>med</span> AI
          </div>
          <div style={{fontSize:'13px', color:'#7a8fa6'}}>Sign in to your account</div>
        </div>

        <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'32px', borderRadius:'4px'}}>

          {error && (
            <div style={{padding:'10px 14px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'4px', color:'#ef4444', fontSize:'12px', marginBottom:'16px'}}>
              ⚠️ {error}
            </div>
          )}

          <div style={{marginBottom:'16px'}}>
            <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>EMAIL</div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleLogin()}
              placeholder="admin@hayyamed.ai"
              style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'13px', outline:'none'}}
            />
          </div>

          <div style={{marginBottom:'24px'}}>
            <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>PASSWORD</div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleLogin()}
              placeholder="••••••••"
              style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'13px', outline:'none'}}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{width:'100%', height:'42px', background: loading ? '#1a2235' : '#00e5a0', color: loading ? '#7a8fa6' : '#07090f', border:'none', borderRadius:'4px', fontSize:'13px', fontWeight:'700', cursor: loading ? 'not-allowed' : 'pointer'}}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{textAlign:'center', marginTop:'20px', fontSize:'11px', color:'#3d4f63'}}>
            Demo: admin@hayyamed.ai / hayyamed2024
          </div>

          <div style={{textAlign:'center', marginTop:'8px', fontSize:'12px', color:'#7a8fa6'}}>
            Powered by Hayyamed AI — Qatar 🇶🇦
          </div>
        </div>
      </div>
    </div>
  )
}