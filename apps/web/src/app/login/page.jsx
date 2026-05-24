'use client'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = () => {
    if (email && password) {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif'}}>
      <div style={{width:'100%', maxWidth:'400px', padding:'0 20px'}}>
        
        <div style={{textAlign:'center', marginBottom:'40px'}}>
          <div style={{fontSize:'24px', fontWeight:'800', marginBottom:'8px'}}>
            Hayya<span style={{color:'#00e5a0'}}>med</span> AI
          </div>
          <div style={{fontSize:'13px', color:'#7a8fa6'}}>Sign in to your account</div>
        </div>

        <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'32px', borderRadius:'4px'}}>
          
          <div style={{marginBottom:'16px'}}>
            <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>EMAIL</div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'13px', outline:'none'}}
            />
          </div>

          <div style={{marginBottom:'24px'}}>
            <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>PASSWORD</div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'13px', outline:'none'}}
            />
          </div>

          <button
            onClick={handleLogin}
            style={{width:'100%', height:'40px', background:'#00e5a0', color:'#07090f', border:'none', borderRadius:'4px', fontSize:'13px', fontWeight:'700', cursor:'pointer'}}>
            Sign In
          </button>

          <div style={{textAlign:'center', marginTop:'16px', fontSize:'12px', color:'#7a8fa6'}}>
            Powered by Hayyamed AI — Qatar 🇶🇦
          </div>
        </div>
      </div>
    </div>
  )
}