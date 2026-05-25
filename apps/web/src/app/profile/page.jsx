'use client'
import { useState } from 'react'

export default function Profile() {
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState('Abbas Al Masri')
  const [email, setEmail] = useState('wopalncom@gmail.com')
  const [phone, setPhone] = useState('+974 5555 0000')
  const [company, setCompany] = useState('Hayyamed AI')
  const [role, setRole] = useState('Admin')

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', minHeight:'100vh', fontFamily:'sans-serif'}}>

      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px'}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
        <div onClick={() => window.location.href='/dashboard'} style={{width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', cursor:'pointer'}}>A</div>
      </div>

      <div style={{display:'flex', height:'calc(100vh - 52px)'}}>

        <div style={{width:'56px', background:'#0c0f1a', borderRight:'1px solid #1a2235', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:'8px'}}>
          <a href="/dashboard" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>⊞</a>
          <a href="/inbox" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>💬</a>
          <a href="/contacts" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>👥</a>
          <a href="/analytics" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>📈</a>
          <a href="/reports" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>📊</a>
          <a href="/campaigns" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>📣</a>
          <a href="/chatbot" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>🤖</a>
          <a href="/agency" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>🏢</a>
          <a href="/notifications" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>🔔</a>
          <a href="/settings" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>⚙️</a>
        </div>

        <div style={{flex:1, overflowY:'auto', padding:'32px', display:'flex', justifyContent:'center'}}>
          <div style={{width:'100%', maxWidth:'600px'}}>

            <div style={{display:'flex', alignItems:'center', gap:'16px', marginBottom:'32px'}}>
              <a href="/dashboard" style={{color:'#7a8fa6', textDecoration:'none', fontSize:'12px'}}>← Back to Dashboard</a>
            </div>

            <div style={{fontWeight:'800', fontSize:'20px', marginBottom:'6px'}}>My Profile</div>
            <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'32px'}}>Manage your personal information</div>

            {/* Avatar */}
            <div style={{display:'flex', alignItems:'center', gap:'20px', marginBottom:'32px', padding:'24px', background:'#0f1520', border:'1px solid #1a2235', borderRadius:'4px'}}>
              <div style={{width:'72px', height:'72px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontWeight:'800', flexShrink:0}}>A</div>
              <div>
                <div style={{fontWeight:'700', fontSize:'16px', marginBottom:'4px'}}>{name}</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'8px'}}>{role} · {company}</div>
                <button style={{padding:'6px 14px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer'}}>Change Photo</button>
              </div>
            </div>

            {/* Form */}
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'4px', marginBottom:'16px'}}>
              <div style={{fontWeight:'700', fontSize:'14px', marginBottom:'20px'}}>Personal Information</div>

              {[
                {label:'FULL NAME', value:name, setter:setName},
                {label:'EMAIL', value:email, setter:setEmail},
                {label:'PHONE', value:phone, setter:setPhone},
                {label:'COMPANY', value:company, setter:setCompany},
              ].map(f => (
                <div key={f.label} style={{marginBottom:'16px'}}>
                  <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>{f.label}</div>
                  <input value={f.value} onChange={e => f.setter(e.target.value)} style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}/>
                </div>
              ))}

              <div style={{marginBottom:'16px'}}>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>ROLE</div>
                <select value={role} onChange={e => setRole(e.target.value)} style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none', cursor:'pointer'}}>
                  <option>Admin</option>
                  <option>Agent</option>
                  <option>Manager</option>
                </select>
              </div>
            </div>

            {/* Stats */}
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'4px', marginBottom:'16px'}}>
              <div style={{fontWeight:'700', fontSize:'14px', marginBottom:'16px'}}>Account Stats</div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px'}}>
                {[
                  {label:'Messages Sent', value:'1,234'},
                  {label:'Contacts Added', value:'456'},
                  {label:'Campaigns Run', value:'12'},
                ].map(s => (
                  <div key={s.label} style={{textAlign:'center', padding:'16px', background:'#111622', borderRadius:'4px'}}>
                    <div style={{fontSize:'22px', fontWeight:'800', color:'#00e5a0', marginBottom:'4px'}}>{s.value}</div>
                    <div style={{fontSize:'10px', color:'#3d4f63'}}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={save} style={{padding:'10px 24px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>
                {saved ? '✅ Saved!' : 'Save Changes'}
              </button>
              <button onClick={() => {
                localStorage.removeItem('hayyamed_auth')
                window.location.href = '/login'
              }} style={{padding:'10px 24px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'4px', color:'#ef4444', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>
                🚪 Logout
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}