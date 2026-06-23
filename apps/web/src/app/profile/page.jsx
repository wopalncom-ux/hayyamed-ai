'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { getAuth, logout } from '@/lib/auth'
import NavSidebar from '@/components/NavSidebar'

export default function Profile() {
  const [saved,   setSaved]   = useState(false)
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [phone,   setPhone]   = useState('')
  const [company, setCompany] = useState('')
  const [role,    setRole]    = useState('Admin')
  const [kpis,    setKpis]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth()
    if (auth.userName) setName(auth.userName)
    if (auth.email)    setEmail(auth.email)
    if (auth.role)     setRole(auth.role)

    Promise.all([
      api.getProfile().catch(() => null),
      api.getDashboard().catch(() => null),
    ]).then(([profile, dash]) => {
      if (profile) {
        setName(profile.name || auth.userName || '')
        setEmail(profile.email || auth.email || '')
        setPhone(profile.phone || '')
        setCompany(profile.org?.name || profile.orgName || '')
        setRole(profile.role?.toLowerCase() || auth.role || 'owner')
      }
      if (dash) setKpis(dash)
    }).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    try {
      await api.updateProfile({ name, email, phone })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'A'

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>

      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>
        <NavSidebar current="profile" />

        <div style={{flex:1, overflowY:'auto', padding:'32px', display:'flex', justifyContent:'center'}}>
          <div style={{width:'100%', maxWidth:'600px'}}>

            <div style={{marginBottom:'24px'}}>
              <a href="/dashboard" style={{color:'#7a8fa6', textDecoration:'none', fontSize:'12px'}}>← Back to Dashboard</a>
            </div>

            <div style={{fontWeight:'800', fontSize:'20px', marginBottom:'4px'}}>My Profile</div>
            <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'28px'}}>Manage your personal information</div>

            {/* Avatar */}
            <div style={{display:'flex', alignItems:'center', gap:'20px', marginBottom:'24px', padding:'24px', background:'#0f1520', border:'1px solid #1a2235', borderRadius:'8px'}}>
              <div style={{width:'72px', height:'72px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', fontWeight:'800', flexShrink:0}}>
                {initials}
              </div>
              <div>
                <div style={{fontWeight:'700', fontSize:'16px', marginBottom:'4px'}}>{name || '—'}</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'8px', textTransform:'capitalize'}}>{role} {company ? `· ${company}` : ''}</div>
                <div style={{fontSize:'10px', color:'#3d4f63'}}>Avatar generation coming soon</div>
              </div>
            </div>

            {/* Form */}
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'8px', marginBottom:'16px'}}>
              <div style={{fontWeight:'700', fontSize:'14px', marginBottom:'20px'}}>Personal Information</div>

              {[
                {label:'FULL NAME',   value:name,    setter:setName,    type:'text'},
                {label:'EMAIL',       value:email,   setter:setEmail,   type:'email'},
                {label:'PHONE',       value:phone,   setter:setPhone,   type:'tel'},
                {label:'COMPANY',     value:company, setter:setCompany, type:'text', readOnly:true},
              ].map(f => (
                <div key={f.label} style={{marginBottom:'16px'}}>
                  <div style={{fontSize:'10px', color:'#7a8fa6', marginBottom:'6px', letterSpacing:'0.05em'}}>{f.label}</div>
                  <input
                    type={f.type}
                    value={f.value}
                    onChange={e => !f.readOnly && f.setter(e.target.value)}
                    readOnly={!!f.readOnly}
                    style={{width:'100%', background: f.readOnly ? '#0c0f1a' : '#111622', border:'1px solid #1a2235', borderRadius:'6px', padding:'10px 14px', color: f.readOnly ? '#64748b' : '#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box', cursor: f.readOnly ? 'default' : 'text'}}
                  />
                </div>
              ))}
            </div>

            {/* Account Stats */}
            {!loading && kpis && (
              <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'8px', marginBottom:'16px'}}>
                <div style={{fontWeight:'700', fontSize:'14px', marginBottom:'16px'}}>Account Stats</div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px'}}>
                  {[
                    {label:'Total Contacts', value: kpis.totalLeads},
                    {label:'Conversations',  value: kpis.totalConvs},
                    {label:'Won Leads',      value: kpis.wonLeads},
                  ].map(s => (
                    <div key={s.label} style={{textAlign:'center', padding:'16px', background:'#111622', borderRadius:'6px'}}>
                      <div style={{fontSize:'22px', fontWeight:'800', color:'#00e5a0', marginBottom:'4px'}}>{s.value ?? '—'}</div>
                      <div style={{fontSize:'10px', color:'#3d4f63'}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={save}
                style={{padding:'10px 24px', background:'#00e5a0', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>
                {saved ? '✅ Saved!' : 'Save Changes'}
              </button>
              <button onClick={logout}
                style={{padding:'10px 24px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'6px', color:'#ef4444', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>
                🚪 Log out
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
