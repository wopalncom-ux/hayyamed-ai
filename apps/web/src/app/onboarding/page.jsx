'use client'
import { useState } from 'react'

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('')
  const [botName, setBotName] = useState('Hayyamed Assistant')

  const inp = {width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none', marginBottom:'16px'}
  const sel = {width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none', marginBottom:'16px', cursor:'pointer'}
  const lbl = {fontSize:'11px', color:'#7a8fa6', marginBottom:'6px', display:'block'}

  const steps = ['Welcome','Business','WhatsApp','AI Setup','Team','Ready']

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', minHeight:'100vh', fontFamily:'sans-serif', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px'}}>

      <div style={{fontWeight:'800', fontSize:'20px', marginBottom:'32px'}}>
        Hayya<span style={{color:'#00e5a0'}}>med</span> AI
      </div>

      <div style={{display:'flex', alignItems:'center', marginBottom:'40px'}}>
        {steps.map((s, i) => (
          <div key={i} style={{display:'flex', alignItems:'center'}}>
            <div style={{width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', background: step > i+1 ? '#00e5a0' : step === i+1 ? 'rgba(0,229,160,.1)' : '#111622', border:'2px solid', borderColor: step >= i+1 ? '#00e5a0' : '#1a2235', color: step > i+1 ? '#07090f' : step === i+1 ? '#00e5a0' : '#3d4f63'}}>
              {step > i+1 ? '✓' : i+1}
            </div>
            {i < steps.length - 1 && (
              <div style={{width:'30px', height:'2px', background: step > i+1 ? '#00e5a0' : '#1a2235'}}></div>
            )}
          </div>
        ))}
      </div>

      <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'32px', borderRadius:'4px', width:'100%', maxWidth:'520px'}}>

        {step === 1 && (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'48px', marginBottom:'16px'}}>👋</div>
            <div style={{fontWeight:'800', fontSize:'22px', marginBottom:'8px'}}>Welcome to Hayyamed AI!</div>
            <div style={{fontSize:'13px', color:'#7a8fa6', marginBottom:'24px'}}>Set up your account in just a few minutes.</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px'}}>
              {[{icon:'💬', label:'Connect WhatsApp'},{icon:'🤖', label:'Setup AI'},{icon:'📊', label:'Start Growing'}].map(f => (
                <div key={f.label} style={{background:'#111622', border:'1px solid #1a2235', padding:'16px', borderRadius:'4px'}}>
                  <div style={{fontSize:'24px', marginBottom:'8px'}}>{f.icon}</div>
                  <div style={{fontSize:'11px', color:'#7a8fa6'}}>{f.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{fontSize:'32px', marginBottom:'12px'}}>🏢</div>
            <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'20px'}}>Business Information</div>
            <label style={lbl}>BUSINESS NAME</label>
            <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Al Meera Markets" style={inp}/>
            <label style={lbl}>INDUSTRY</label>
            <select value={industry} onChange={e => setIndustry(e.target.value)} style={sel}>
              <option value="">Select industry...</option>
              <option>Healthcare</option>
              <option>Retail</option>
              <option>Restaurant</option>
              <option>Real Estate</option>
              <option>Education</option>
              <option>Technology</option>
              <option>Other</option>
            </select>
            <label style={lbl}>COUNTRY</label>
            <select style={sel}>
              <option>Qatar</option>
              <option>UAE</option>
              <option>Saudi Arabia</option>
              <option>Kuwait</option>
              <option>Bahrain</option>
              <option>Oman</option>
            </select>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{fontSize:'32px', marginBottom:'12px'}}>💬</div>
            <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'20px'}}>Connect WhatsApp</div>
            <div style={{padding:'16px', background:'rgba(0,229,160,.05)', border:'1px solid rgba(0,229,160,.2)', borderRadius:'4px', marginBottom:'20px', fontSize:'11px', color:'#7a8fa6', lineHeight:'1.8'}}>
              Requirements: Meta Business account, WhatsApp Business API, Verified number
            </div>
            <label style={lbl}>WHATSAPP NUMBER</label>
            <input placeholder="+974 5555 0000" style={inp}/>
            <label style={lbl}>PHONE NUMBER ID</label>
            <input placeholder="From Meta Developer Console" style={inp}/>
            <label style={lbl}>ACCESS TOKEN</label>
            <input type="password" placeholder="EAABs..." style={inp}/>
          </div>
        )}

        {step === 4 && (
          <div>
            <div style={{fontSize:'32px', marginBottom:'12px'}}>🤖</div>
            <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'20px'}}>Setup AI Assistant</div>
            <label style={lbl}>BOT NAME</label>
            <input value={botName} onChange={e => setBotName(e.target.value)} placeholder="e.g. Sara Assistant" style={inp}/>
            <label style={lbl}>DEFAULT LANGUAGE</label>
            <select style={sel}>
              <option>Arabic + English</option>
              <option>Arabic Only</option>
              <option>English Only</option>
            </select>
            <label style={lbl}>AI PERSONALITY</label>
            <select style={sel}>
              <option>Professional and helpful</option>
              <option>Friendly and casual</option>
              <option>Formal and corporate</option>
            </select>
            <label style={lbl}>BUSINESS DESCRIPTION</label>
            <textarea rows={3} placeholder="Describe your business..." style={{...inp, resize:'vertical'}}/>
          </div>
        )}

        {step === 5 && (
          <div>
            <div style={{fontSize:'32px', marginBottom:'12px'}}>👥</div>
            <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'20px'}}>Invite Your Team</div>
            <label style={lbl}>TEAM EMAILS (one per line)</label>
            <textarea rows={5} placeholder="agent1@company.com" style={{...inp, resize:'vertical'}}/>
          </div>
        )}

        {step === 6 && (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'48px', marginBottom:'16px'}}>🚀</div>
            <div style={{fontWeight:'800', fontSize:'22px', marginBottom:'8px'}}>You are all set!</div>
            <div style={{fontSize:'13px', color:'#7a8fa6', marginBottom:'24px'}}>
              Welcome {businessName || 'to Hayyamed AI'}! Your platform is ready.
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px', marginBottom:'24px'}}>
              {[
                {icon:'💬', label:'Go to Inbox', path:'/inbox'},
                {icon:'👥', label:'Contacts', path:'/contacts'},
                {icon:'📊', label:'Reports', path:'/reports'},
                {icon:'🤖', label:'Chatbot', path:'/chatbot'},
              ].map(f => (
                <a key={f.label} href={f.path} style={{background:'#111622', border:'1px solid #1a2235', padding:'16px', borderRadius:'4px', textDecoration:'none', color:'#e2e8f0', display:'block'}}>
                  <div style={{fontSize:'24px', marginBottom:'8px'}}>{f.icon}</div>
                  <div style={{fontSize:'11px', color:'#7a8fa6'}}>{f.label}</div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div style={{display:'flex', gap:'10px', marginTop:'24px'}}>
          {step > 1 && step < 6 && (
            <button onClick={() => setStep(step-1)} style={{flex:1, padding:'10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'12px', cursor:'pointer'}}>
              Back
            </button>
          )}
          {step < 6 && (
            <button onClick={() => setStep(step+1)} style={{flex:2, padding:'10px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>
              {step === 5 ? 'Complete Setup' : 'Continue'}
            </button>
          )}
          {step === 6 && (
            <a href="/dashboard" style={{flex:1, padding:'10px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', textAlign:'center', textDecoration:'none', display:'block'}}>
              Go to Dashboard
            </a>
          )}
        </div>
      </div>

      <div style={{marginTop:'16px', fontSize:'11px', color:'#3d4f63'}}>
        Step {step} of {steps.length} — {steps[step-1]}
      </div>
    </div>
  )
}