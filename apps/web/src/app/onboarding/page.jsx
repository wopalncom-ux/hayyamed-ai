'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getAuth } from '@/lib/auth'

const STEPS = [
  { id: 1, icon: '🏢', title: 'Business Info',   desc: 'Tell us about your business' },
  { id: 2, icon: '📱', title: 'Channels',         desc: 'Connect your messaging channels' },
  { id: 3, icon: '🤖', title: 'AI Agent',         desc: 'Set up your AI assistant' },
  { id: 4, icon: '👥', title: 'Team',             desc: 'Invite your team members' },
  { id: 5, icon: '🚀', title: 'Launch',           desc: 'You are ready to go!' },
]

const INDUSTRIES = [
  'Healthcare & Medical', 'Dental Clinic', 'Beauty & Spa', 'Real Estate',
  'Education & Training', 'Restaurant & Food', 'Legal Services',
  'Automotive', 'Retail & E-commerce', 'Hospitality', 'Other',
]

const CHANNELS = [
  { id:'whatsapp',  icon:'💬', label:'WhatsApp',  desc:'Most popular in GCC',      color:'#00e5a0' },
  { id:'instagram', icon:'📸', label:'Instagram', desc:'DMs & story replies',       color:'#a78bfa' },
  { id:'facebook',  icon:'👤', label:'Facebook',  desc:'Messenger integration',     color:'#3b82f6' },
  { id:'email',     icon:'📧', label:'Email',     desc:'Professional inbox',        color:'#fbbf24' },
  { id:'telegram',  icon:'✈️', label:'Telegram',  desc:'Fast & secure messaging',   color:'#f97316' },
  { id:'webchat',   icon:'💻', label:'Web Chat',  desc:'Chat widget on your site',  color:'#06b6d4' },
]

const AI_TONES = ['Professional', 'Friendly', 'Formal', 'Concise', 'Empathetic']
const AI_LANGS = [
  { id:'ar',   label:'Arabic (عربي)' },
  { id:'en',   label:'English' },
  { id:'both', label:'Both Arabic & English' },
]

function StepIndicator({ step }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'4px', marginBottom:'32px' }}>
      {STEPS.map((s, i) => {
        const done    = s.id < step
        const current = s.id === step
        return (
          <div key={s.id} style={{ display:'flex', alignItems:'center', gap:'4px', flex: i < STEPS.length-1 ? 1 : 'none' }}>
            <div style={{
              width:'28px', height:'28px', borderRadius:'50%', flexShrink:0,
              background: done ? '#00e5a0' : current ? 'rgba(0,229,160,.12)' : '#111622',
              border: `2px solid ${done ? '#00e5a0' : current ? '#00e5a0' : '#1a2235'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize: done ? '12px' : '10px', color: done ? '#07090f' : current ? '#00e5a0' : '#3d4f63',
              fontWeight:'700',
            }}>
              {done ? '✓' : s.id}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex:1, height:'2px', background: done ? '#00e5a0' : '#1a2235', borderRadius:'1px' }}/>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  useEffect(() => {
    const auth = getAuth()
    if (!auth.loggedIn) router.replace('/register')
  }, [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [bizName, setBizName] = useState('')
  const [bizIndustry, setBizIndustry] = useState('')
  const [bizCountry, setBizCountry] = useState('Qatar')
  const [bizPhone, setBizPhone] = useState('')
  const [bizWebsite, setBizWebsite] = useState('')
  const [selectedChannels, setSelectedChannels] = useState(['whatsapp'])
  const [agentName, setAgentName] = useState('Layla')
  const [agentTone, setAgentTone] = useState('Professional')
  const [agentLang, setAgentLang] = useState('both')
  const [agentObjective, setAgentObjective] = useState('')
  const [teamEmails, setTeamEmails] = useState([''])

  const toggleChannel = (id) => {
    setSelectedChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const next = async () => {
    setError('')
    if (step === 1 && !bizName.trim()) { setError('Business name is required'); return }
    if (step === 2 && selectedChannels.length === 0) { setError('Select at least one channel'); return }
    if (step < STEPS.length) { setStep(s => s + 1); return }

    setSaving(true)
    try {
      await api.saveSettings({
        businessName: bizName, industry: bizIndustry, country: bizCountry,
        phone: bizPhone, website: bizWebsite, channels: selectedChannels,
        aiAgentName: agentName, aiAgentTone: agentTone,
        aiAgentLanguage: agentLang, aiAgentObjective: agentObjective,
      })
      await api.createAgent({
        name: agentName, role: 'customer_service', language: agentLang,
        personality: agentTone.toLowerCase(),
        objective: agentObjective || 'Assist customers and qualify leads',
        channels: selectedChannels, isActive: true,
      }).catch(() => {})
      router.push('/dashboard')
    } catch (err) {
      setError(err.message || 'Setup failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const currentStep = STEPS.find(s => s.id === step)

  return (
    <div style={{ minHeight:'100vh', background:'#07090f', color:'#e2e8f0', fontFamily:'system-ui, sans-serif', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px' }}>

      <div style={{ marginBottom:'40px', textAlign:'center' }}>
        <div style={{ fontWeight:'900', fontSize:'24px', letterSpacing:'-0.02em', marginBottom:'4px' }}>
          Hayya<span style={{ color:'#00e5a0' }}>med</span> <span style={{ color:'#64748b', fontWeight:'400' }}>AI</span>
        </div>
        <div style={{ fontSize:'12px', color:'#64748b' }}>AI-Powered CRM for GCC Businesses</div>
      </div>

      <div style={{ width:'100%', maxWidth:'560px', background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'12px', padding:'32px' }}>
        <StepIndicator step={step} />

        <div style={{ marginBottom:'28px' }}>
          <div style={{ fontSize:'24px', marginBottom:'6px' }}>{currentStep?.icon}</div>
          <div style={{ fontSize:'20px', fontWeight:'800', marginBottom:'4px' }}>{currentStep?.title}</div>
          <div style={{ fontSize:'13px', color:'#64748b' }}>{currentStep?.desc}</div>
        </div>

        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'5px', fontWeight:'700' }}>BUSINESS NAME *</label>
              <input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="e.g. Bright Smile Dental"
                style={{ width:'100%', padding:'10px 14px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'5px', fontWeight:'700' }}>INDUSTRY</label>
              <select value={bizIndustry} onChange={e => setBizIndustry(e.target.value)}
                style={{ width:'100%', padding:'10px 14px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', cursor:'pointer' }}
              >
                <option value="">Select industry…</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div>
                <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'5px', fontWeight:'700' }}>COUNTRY</label>
                <select value={bizCountry} onChange={e => setBizCountry(e.target.value)}
                  style={{ width:'100%', padding:'10px 14px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', cursor:'pointer' }}
                >
                  {['Qatar','Saudi Arabia','UAE','Kuwait','Bahrain','Oman'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'5px', fontWeight:'700' }}>PHONE</label>
                <input value={bizPhone} onChange={e => setBizPhone(e.target.value)} placeholder="+974 XXXX XXXX"
                  style={{ width:'100%', padding:'10px 14px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'5px', fontWeight:'700' }}>WEBSITE (optional)</label>
              <input value={bizWebsite} onChange={e => setBizWebsite(e.target.value)} placeholder="https://yoursite.com"
                style={{ width:'100%', padding:'10px 14px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            {CHANNELS.map(ch => {
              const active = selectedChannels.includes(ch.id)
              return (
                <div key={ch.id} onClick={() => toggleChannel(ch.id)}
                  style={{ padding:'14px', background: active ? `${ch.color}12` : '#111622', border:`2px solid ${active ? ch.color : '#1a2235'}`, borderRadius:'8px', cursor:'pointer', transition:'all .15s' }}
                >
                  <div style={{ fontSize:'20px', marginBottom:'6px' }}>{ch.icon}</div>
                  <div style={{ fontSize:'13px', fontWeight:'700', color: active ? ch.color : '#e2e8f0' }}>{ch.label}</div>
                  <div style={{ fontSize:'10px', color:'#64748b', marginTop:'2px' }}>{ch.desc}</div>
                  {ch.id === 'whatsapp' && <div style={{ fontSize:'9px', color:'#00e5a0', marginTop:'4px', fontWeight:'700' }}>RECOMMENDED</div>}
                </div>
              )
            })}
            <div style={{ gridColumn:'1/-1', fontSize:'11px', color:'#64748b', marginTop:'4px' }}>
              Connect API credentials for each channel in Settings after setup.
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'5px', fontWeight:'700' }}>AI AGENT NAME</label>
              <input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="e.g. Layla, Sara, Max"
                style={{ width:'100%', padding:'10px 14px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'8px', fontWeight:'700' }}>COMMUNICATION TONE</label>
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                {AI_TONES.map(t => (
                  <button key={t} onClick={() => setAgentTone(t)}
                    style={{ padding:'6px 14px', background: agentTone===t ? 'rgba(0,229,160,.1)' : '#111622', border:`1px solid ${agentTone===t ? '#00e5a0' : '#1a2235'}`, borderRadius:'4px', color: agentTone===t ? '#00e5a0' : '#64748b', fontSize:'12px', cursor:'pointer', fontWeight: agentTone===t ? '700' : '400' }}
                  >{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'8px', fontWeight:'700' }}>REPLY LANGUAGE</label>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {AI_LANGS.map(l => (
                  <label key={l.id} style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', padding:'8px 12px', background: agentLang===l.id ? 'rgba(0,229,160,.06)' : '#111622', border:`1px solid ${agentLang===l.id ? '#00e5a0' : '#1a2235'}`, borderRadius:'6px' }}>
                    <input type="radio" checked={agentLang===l.id} onChange={() => setAgentLang(l.id)} style={{ accentColor:'#00e5a0' }}/>
                    <span style={{ fontSize:'12px', color: agentLang===l.id ? '#e2e8f0' : '#64748b' }}>{l.label}</span>
                    {l.id==='both' && <span style={{ fontSize:'9px', color:'#00e5a0', fontWeight:'700', marginLeft:'auto' }}>RECOMMENDED</span>}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'5px', fontWeight:'700' }}>AI OBJECTIVE (optional)</label>
              <textarea value={agentObjective} onChange={e => setAgentObjective(e.target.value)} rows={3}
                placeholder="e.g. Greet customers, answer questions about dental services, book appointments, and qualify leads..."
                style={{ width:'100%', padding:'10px 14px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'12px', outline:'none', boxSizing:'border-box', resize:'vertical', lineHeight:'1.6' }}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <div style={{ padding:'12px', background:'rgba(0,229,160,.04)', border:'1px solid rgba(0,229,160,.1)', borderRadius:'6px', fontSize:'12px', color:'#64748b', marginBottom:'4px' }}>
              Invite your team to handle conversations and manage contacts. You can skip this and invite later.
            </div>
            {teamEmails.map((email, i) => (
              <div key={i} style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                <input value={email} onChange={e => setTeamEmails(prev => prev.map((em, idx) => idx===i ? e.target.value : em))}
                  placeholder="team.member@company.com" type="email"
                  style={{ flex:1, padding:'10px 14px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', outline:'none' }}
                />
                {teamEmails.length > 1 && (
                  <button onClick={() => setTeamEmails(prev => prev.filter((_, idx) => idx!==i))}
                    style={{ padding:'10px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.15)', borderRadius:'6px', color:'#ef4444', cursor:'pointer', fontSize:'12px' }}
                  >✕</button>
                )}
              </div>
            ))}
            {teamEmails.length < 5 && (
              <button onClick={() => setTeamEmails(prev => [...prev, ''])}
                style={{ padding:'10px', background:'#111622', border:'1px dashed #1a2235', borderRadius:'6px', color:'#64748b', fontSize:'12px', cursor:'pointer', textAlign:'center' }}
              >+ Add another email</button>
            )}
          </div>
        )}

        {step === 5 && (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>🚀</div>
            <div style={{ fontSize:'18px', fontWeight:'800', marginBottom:'8px' }}>You are all set!</div>
            <div style={{ fontSize:'13px', color:'#64748b', lineHeight:'1.7', marginBottom:'20px' }}>
              Your AI agent <strong style={{ color:'#00e5a0' }}>{agentName}</strong> is ready on {selectedChannels.length} channel{selectedChannels.length!==1 ? 's' : ''}.
              <br/>Head to your dashboard to explore all features.
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginTop:'20px' }}>
              {[['💬','AI Inbox'],['⚡','Automations'],['📊','Analytics']].map(([icon, label]) => (
                <div key={label} style={{ padding:'12px 8px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px' }}>
                  <div style={{ fontSize:'20px', marginBottom:'4px' }}>{icon}</div>
                  <div style={{ fontSize:'11px', fontWeight:'700' }}>{label}</div>
                  <div style={{ fontSize:'9px', color:'#00e5a0', fontWeight:'700' }}>Ready</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop:'14px', padding:'10px 14px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'6px', fontSize:'12px', color:'#ef4444' }}>{error}</div>
        )}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'24px' }}>
          {step > 1
            ? <button onClick={() => { setStep(s => s-1); setError('') }}
                style={{ padding:'10px 20px', background:'none', border:'1px solid #1a2235', borderRadius:'6px', color:'#64748b', fontSize:'13px', cursor:'pointer' }}>← Back</button>
            : <div/>}
          {step < 5 ? (
            <div style={{ display:'flex', gap:'8px' }}>
              {step === 4 && (
                <button onClick={() => setStep(5)}
                  style={{ padding:'10px 16px', background:'none', border:'none', color:'#64748b', fontSize:'12px', cursor:'pointer' }}>
                  Skip for now
                </button>
              )}
              <button onClick={next}
                style={{ padding:'10px 24px', background:'#00e5a0', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'13px', cursor:'pointer' }}>
                Continue →
              </button>
            </div>
          ) : (
            <button onClick={next} disabled={saving}
              style={{ padding:'12px 32px', background: saving ? '#1a2235' : '#00e5a0', border:'none', borderRadius:'6px', color: saving ? '#3d4f63' : '#07090f', fontWeight:'800', fontSize:'14px', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Setting up…' : '🚀 Launch My CRM'}
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop:'20px', fontSize:'11px', color:'#3d4f63', textAlign:'center' }}>
        Your data stays in Qatar (me-central1). GDPR & PDPL compliant.
      </div>
    </div>
  )
}
