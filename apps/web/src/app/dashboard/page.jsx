'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { getAuth, ROLE_LABELS, canSee } from '@/lib/auth'

const weekData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  messages: [120, 185, 140, 220, 175, 90, 200],
  leads: [45, 62, 38, 85, 70, 30, 95],
  bookings: [12, 18, 10, 25, 20, 8, 28],
  aiResponses: [98, 145, 110, 180, 140, 72, 165],
}

const campaigns = [
  { id:1, name:'Ramadan 2024', channel:'WhatsApp', status:'Completed', sent:1234, leads:89, bookings:34, spend:'QAR 500', roi:'340%', cpl:'QAR 5.6' },
  { id:2, name:'Summer Sale', channel:'Instagram', status:'Active', sent:890, leads:56, bookings:18, spend:'QAR 800', roi:'225%', cpl:'QAR 14.3' },
  { id:3, name:'Eid Special', channel:'Facebook', status:'Active', sent:456, leads:34, bookings:12, spend:'QAR 300', roi:'400%', cpl:'QAR 8.8' },
  { id:4, name:'New Year', channel:'WhatsApp', status:'Draft', sent:0, leads:0, bookings:0, spend:'QAR 0', roi:'0%', cpl:'QAR 0' },
]

const funnel = [
  { stage:'New Leads', count:425, color:'#3b82f6', pct:100 },
  { stage:'Hot Leads', count:180, color:'#f97316', pct:42 },
  { stage:'Booked', count:89, color:'#a78bfa', pct:21 },
  { stage:'Won', count:67, color:'#00e5a0', pct:16 },
]

const statusColors = { Active:'#00e5a0', Completed:'#3b82f6', Draft:'#f97316' }
const channelIcons = { WhatsApp:'💬', Instagram:'📸', Facebook:'👤', Telegram:'✈️' }
const maxVal = Math.max(...weekData.messages)

export default function Dashboard() {
  const [showMenu, setShowMenu] = useState(false)
  const [period, setPeriod] = useState('week')
  const [metric, setMetric] = useState('messages')
  const [aiAdvice, setAiAdvice] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [stats, setStats] = useState(null)
  const [auth, setAuth] = useState({})

  useEffect(() => {
    api.getDashboard().then(data => setStats(data)).catch(() => {})
    setAuth(getAuth())
  }, [])

  const role      = auth.role || 'owner'
  const userName  = auth.userName || 'Abbas Al Masri'
  const userInit  = userName.split(' ').map(n=>n[0]).join('').slice(0,2)
  const roleInfo  = ROLE_LABELS[role] || ROLE_LABELS.owner

  const logout = () => {
    localStorage.removeItem('hayyamed_auth')
    window.location.href = '/login'
  }

  const getAiAdvice = async (question) => {
    setAiLoading(true)
    setAiAdvice('')
    setShowAiPanel(true)
    try {
      const context = `
        Current business data:
        - Total messages this week: 1,130
        - Total leads: 425
        - Bookings: 121
        - Conversion rate: 16%
        - Best performing campaign: Ramadan 2024 (ROI 340%)
        - Active campaigns: Summer Sale (Instagram), Eid Special (Facebook)
        - Most leads from: WhatsApp (45%), Instagram (25%)
        - AI response rate: 94%
      `
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question + '\n\nBusiness context:\n' + context,
          history: [{
            role: 'system',
            content: 'You are an expert business advisor for a Qatar-based CRM platform. Give specific, actionable advice based on the data provided. Be concise and direct.'
          }]
        })
      })
      const data = await res.json()
      setAiAdvice(data.reply)
    } catch {
      setAiAdvice('AI advisor is not available right now.')
    }
    setAiLoading(false)
  }

  const quickAdvice = [
    'How can I increase my leads?',
    'Which campaign should I run next?',
    'What is my best performing channel?',
    'How to improve booking rate?',
    'Should I run WhatsApp or Instagram ads?',
    'What call to action works best for my leads?',
  ]

  const chartData = weekData[metric] || weekData.messages
  const chartMax = Math.max(...chartData)

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', minHeight:'100vh', fontFamily:'sans-serif'}}>

      {/* Topbar */}
      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'12px', position:'sticky', top:0, zIndex:50}}>
        <img src="/logo.svg" alt="Hayyamed" style={{height:'40px', width:'auto'}} />
        <div style={{marginLeft:'auto'}}/>
        <span style={{fontSize:'10px', padding:'4px 10px', background:`${roleInfo.color}15`, border:`1px solid ${roleInfo.color}40`, borderRadius:'4px', color:roleInfo.color, fontWeight:'700'}}>{roleInfo.label}</span>
        <button onClick={() => getAiAdvice('Give me a quick summary of my business performance and top 3 recommendations')} style={{padding:'8px 18px', background:'linear-gradient(135deg,rgba(167,139,250,.25),rgba(167,139,250,.12))', border:'1px solid rgba(167,139,250,.5)', borderRadius:'6px', color:'#c4b5fd', fontSize:'12px', cursor:'pointer', fontWeight:'700', letterSpacing:'.3px', display:'flex', alignItems:'center', gap:'7px', boxShadow:'0 0 20px rgba(167,139,250,.15)'}}>
          <span style={{fontSize:'18px'}}>🤖</span> AI Advisor
        </button>
        <div style={{fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
        <div style={{position:'relative'}}>
          <div onClick={() => setShowMenu(!showMenu)} style={{width:'32px', height:'32px', borderRadius:'50%', background:`linear-gradient(135deg,${roleInfo.color},${roleInfo.color}99)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'800', cursor:'pointer', color:'#07090f'}}>{userInit}</div>
          {showMenu && (
            <div style={{position:'absolute', top:'40px', right:'0', background:'#0f1520', border:'1px solid #1a2235', borderRadius:'8px', minWidth:'180px', zIndex:100, padding:'8px', boxShadow:'0 12px 40px rgba(0,0,0,.5)'}}>
              <div style={{padding:'10px 12px', borderBottom:'1px solid #1a2235', marginBottom:'4px'}}>
                <div style={{fontSize:'12px', fontWeight:'700', color:'#e2e8f0'}}>{userName}</div>
                <div style={{fontSize:'10px', color:roleInfo.color, fontWeight:'600', marginTop:'2px'}}>{roleInfo.label}</div>
              </div>
              <a href="/settings" style={{display:'block', padding:'8px 12px', fontSize:'12px', color:'#e2e8f0', textDecoration:'none'}}>⚙️ Settings</a>
              <a href="/profile" style={{display:'block', padding:'8px 12px', fontSize:'12px', color:'#e2e8f0', textDecoration:'none'}}>👤 Profile</a>
              <div onClick={logout} style={{padding:'8px 12px', fontSize:'12px', color:'#ef4444', cursor:'pointer', borderTop:'1px solid #1a2235', marginTop:'4px'}}>🚪 Logout</div>
            </div>
          )}
        </div>
      </div>

      <div style={{display:'flex', height:'calc(100vh - 52px)'}}>

        {/* Sidebar */}
        <div style={{width:'56px', background:'#0c0f1a', borderRight:'1px solid #1a2235', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:'8px', flexShrink:0}}>
          {[
            {h:'/dashboard',    icon:'⊞', page:'dashboard',    active:true},
            {h:'/inbox',        icon:'💬', page:'inbox'},
            {h:'/contacts',     icon:'👥', page:'contacts'},
            {h:'/analytics',    icon:'📈', page:'analytics'},
            {h:'/reports',      icon:'📊', page:'reports'},
            {h:'/campaigns',    icon:'📣', page:'campaigns'},
            {h:'/chatbot',      icon:'🤖', page:'chatbot'},
            {h:'/notifications',icon:'🔔', page:'notifications'},
            {h:'/agency',       icon:'🏢', page:'agency'},
            {h:'/integrations', icon:'🔌', page:'integrations'},
            {h:'/settings',     icon:'⚙️', page:'settings'},
          ].filter(n => canSee(n.page) || n.page === 'dashboard').map(n => (
            <a key={n.h} href={n.h} title={n.page} style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none', background: n.active ? 'rgba(0,229,160,.1)' : 'transparent'}}>{n.icon}</a>
          ))}
        </div>

        {/* Main Content */}
        <div style={{flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'16px'}}>

          {/* Header */}
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:'800', fontSize:'20px'}}>Dashboard</div>
              <div style={{fontSize:'12px', color:'#7a8fa6', marginTop:'3px'}}>Welcome back — here is your business overview</div>
            </div>
            <div style={{display:'flex', gap:'6px'}}>
              {['today','week','month'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{padding:'6px 12px', background: period===p ? '#00e5a0' : '#111622', border:'1px solid #1a2235', borderRadius:'4px', color: period===p ? '#07090f' : '#7a8fa6', fontSize:'11px', cursor:'pointer', fontWeight: period===p ? '700' : '400', textTransform:'capitalize'}}>
                  {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Cards */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px'}}>
            {[
              {label:'MESSAGES', value: stats ? stats.totalConvs.toLocaleString() : '1,130', change:'+18%', color:'#00e5a0', icon:'💬'},
              {label:'LEADS', value: stats ? stats.totalLeads.toLocaleString() : '425', change:'+24%', color:'#3b82f6', icon:'👤'},
              {label:'BOOKINGS', value: stats ? stats.booked.toLocaleString() : '121', change:'+31%', color:'#a78bfa', icon:'📅'},
              {label:'AI RATE', value:'94%', change:'+3%', color:'#f97316', icon:'🤖'},
              {label:'CONVERSION', value: stats ? stats.conversionRate + '%' : '16%', change:'+2%', color:'#fbbf24', icon:'📈'},
            ].map((kpi, i) => (
              <div key={i} style={{background:'#0f1520', border:'1px solid #1a2235', padding:'14px', borderTop:`2px solid ${kpi.color}`}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                  <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px'}}>{kpi.label}</div>
                  <span style={{fontSize:'16px'}}>{kpi.icon}</span>
                </div>
                <div style={{fontSize:'22px', fontWeight:'800'}}>{kpi.value}</div>
                <div style={{fontSize:'10px', marginTop:'4px', color:'#00e5a0'}}>↑ {kpi.change} vs last period</div>
              </div>
            ))}
          </div>

          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'14px'}}>

            {/* Main Chart */}
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'18px'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px'}}>
                <div style={{fontWeight:'700', fontSize:'13px'}}>Performance Chart</div>
                <div style={{display:'flex', gap:'4px'}}>
                  {['messages','leads','bookings','aiResponses'].map(m => (
                    <button key={m} onClick={() => setMetric(m)} style={{padding:'4px 8px', background: metric===m ? '#00e5a0' : '#111622', border:'1px solid #1a2235', borderRadius:'3px', color: metric===m ? '#07090f' : '#7a8fa6', fontSize:'9px', cursor:'pointer', fontWeight: metric===m ? '700' : '400', textTransform:'capitalize'}}>
                      {m === 'aiResponses' ? 'AI' : m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:'flex', alignItems:'flex-end', gap:'6px', height:'140px', marginBottom:'8px'}}>
                {chartData.map((val, i) => (
                  <div key={i} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%', justifyContent:'flex-end', gap:'4px'}}>
                    <div style={{fontSize:'8px', color:'#3d4f63'}}>{val}</div>
                    <div style={{width:'100%', borderRadius:'3px 3px 0 0', background:`linear-gradient(180deg, #00e5a0, #00b37e)`, height:`${(val/chartMax)*100}%`, minHeight:'4px', transition:'height .4s'}}></div>
                    <div style={{fontSize:'8px', color:'#3d4f63'}}>{weekData.labels[i]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lead Funnel */}
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'18px'}}>
              <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'16px'}}>Lead Funnel</div>
              {funnel.map((f, i) => (
                <div key={i} style={{marginBottom:'12px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                    <div style={{fontSize:'11px', color:'#7a8fa6'}}>{f.stage}</div>
                    <div style={{fontSize:'11px', fontWeight:'700', color:f.color}}>{f.count} <span style={{color:'#3d4f63', fontWeight:'400'}}>({f.pct}%)</span></div>
                  </div>
                  <div style={{height:'8px', background:'#1a2235', borderRadius:'4px', overflow:'hidden'}}>
                    <div style={{height:'100%', width:`${f.pct}%`, background:f.color, borderRadius:'4px', transition:'width .5s'}}></div>
                  </div>
                </div>
              ))}
              <div style={{marginTop:'16px', padding:'10px', background:'rgba(0,229,160,.05)', border:'1px solid rgba(0,229,160,.2)', borderRadius:'4px'}}>
                <div style={{fontSize:'10px', color:'#3d4f63', marginBottom:'3px'}}>ESTIMATED ROI</div>
                <div style={{fontSize:'18px', fontWeight:'800', color:'#00e5a0'}}>340%</div>
                <div style={{fontSize:'10px', color:'#7a8fa6'}}>Based on current campaigns</div>
              </div>
            </div>
          </div>

          {/* Campaigns */}
          <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'18px'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px'}}>
              <div style={{fontWeight:'700', fontSize:'13px'}}>Campaign Performance & ROI</div>
              <a href="/campaigns" style={{fontSize:'11px', color:'#00e5a0', textDecoration:'none'}}>View All →</a>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'12px', padding:'8px 12px', background:'#0c0f1a', borderRadius:'4px'}}>
              {['CAMPAIGN','CHANNEL / STATUS','LEADS & BOOKINGS','ROI & COST/LEAD'].map(h => (
                <div key={h} style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px'}}>{h}</div>
              ))}
            </div>
            {campaigns.map(c => (
              <div key={c.id} style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', padding:'10px 12px', borderBottom:'1px solid #1a2235', alignItems:'center'}}>
                <div style={{fontSize:'12px', fontWeight:'600'}}>{c.name}</div>
                <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                  <span style={{fontSize:'14px'}}>{channelIcons[c.channel]}</span>
                  <span style={{fontSize:'10px', padding:'2px 7px', borderRadius:'2px', background:`${statusColors[c.status]}20`, color:statusColors[c.status]}}>{c.status}</span>
                </div>
                <div>
                  <div style={{fontSize:'11px', color:'#7a8fa6'}}>👤 {c.leads} leads · 📅 {c.bookings} booked</div>
                  <div style={{fontSize:'10px', color:'#3d4f63'}}>Sent: {c.sent.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{fontSize:'13px', fontWeight:'800', color:'#00e5a0'}}>{c.roi}</div>
                  <div style={{fontSize:'10px', color:'#7a8fa6'}}>CPL: {c.cpl}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Channel Performance */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'18px'}}>
              <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'14px'}}>Channel Performance</div>
              {[
                {name:'WhatsApp', leads:191, pct:45, color:'#00e5a0'},
                {name:'Instagram', leads:106, pct:25, color:'#a78bfa'},
                {name:'Facebook', leads:77, pct:18, color:'#3b82f6'},
                {name:'Telegram', leads:34, pct:8, color:'#f97316'},
                {name:'Email', leads:17, pct:4, color:'#fbbf24'},
              ].map(ch => (
                <div key={ch.name} style={{marginBottom:'10px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                    <div style={{fontSize:'11px', color:'#7a8fa6'}}>{channelIcons[ch.name] || '📧'} {ch.name}</div>
                    <div style={{fontSize:'11px', color:ch.color, fontWeight:'600'}}>{ch.leads} leads ({ch.pct}%)</div>
                  </div>
                  <div style={{height:'6px', background:'#1a2235', borderRadius:'3px', overflow:'hidden'}}>
                    <div style={{height:'100%', width:`${ch.pct}%`, background:ch.color, borderRadius:'3px'}}></div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'18px'}}>
              <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'14px'}}>AI Performance</div>
              {[
                {label:'Response Rate', value:'94%', color:'#00e5a0', bar:94},
                {label:'Avg Response Time', value:'1.2s', color:'#3b82f6', bar:88},
                {label:'Customer Satisfaction', value:'4.8/5', color:'#a78bfa', bar:96},
                {label:'Lead Qualification', value:'72%', color:'#f97316', bar:72},
                {label:'Handoff to Human', value:'6%', color:'#ef4444', bar:6},
              ].map(s => (
                <div key={s.label} style={{marginBottom:'10px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                    <div style={{fontSize:'11px', color:'#7a8fa6'}}>{s.label}</div>
                    <div style={{fontSize:'11px', color:s.color, fontWeight:'700'}}>{s.value}</div>
                  </div>
                  <div style={{height:'6px', background:'#1a2235', borderRadius:'3px', overflow:'hidden'}}>
                    <div style={{height:'100%', width:`${s.bar}%`, background:s.color, borderRadius:'3px'}}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* AI Advisor Panel */}
        {showAiPanel && (
          <div style={{width:'300px', borderLeft:'1px solid #1a2235', background:'#0c0f1a', display:'flex', flexDirection:'column', flexShrink:0}}>
            <div style={{padding:'14px 16px', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <div>
                <div style={{fontWeight:'700', fontSize:'13px', color:'#a78bfa'}}>🤖 AI Business Advisor</div>
                <div style={{fontSize:'10px', color:'#3d4f63', marginTop:'2px'}}>Powered by GPT-4</div>
              </div>
              <button onClick={() => setShowAiPanel(false)} style={{background:'none', border:'none', color:'#7a8fa6', cursor:'pointer', fontSize:'16px'}}>×</button>
            </div>

            <div style={{padding:'12px', borderBottom:'1px solid #1a2235'}}>
              <div style={{fontSize:'10px', color:'#3d4f63', marginBottom:'8px'}}>QUICK ADVICE:</div>
              {quickAdvice.map(q => (
                <button key={q} onClick={() => getAiAdvice(q)} style={{display:'block', width:'100%', textAlign:'left', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'10px', cursor:'pointer', marginBottom:'5px'}}>
                  💡 {q}
                </button>
              ))}
            </div>

            <div style={{flex:1, padding:'12px', display:'flex', flexDirection:'column', gap:'8px', overflowY:'auto'}}>
              {aiLoading && (
                <div style={{padding:'12px', background:'rgba(167,139,250,.05)', border:'1px solid rgba(167,139,250,.2)', borderRadius:'4px', fontSize:'11px', color:'#a78bfa'}}>
                  🤖 Analyzing your business data...
                </div>
              )}
              {aiAdvice && !aiLoading && (
                <div style={{padding:'14px', background:'rgba(167,139,250,.05)', border:'1px solid rgba(167,139,250,.2)', borderRadius:'4px', fontSize:'11px', color:'#e2e8f0', lineHeight:'1.7'}}>
                  {aiAdvice}
                </div>
              )}
            </div>

            <div style={{padding:'12px', borderTop:'1px solid #1a2235'}}>
              <input
                placeholder="Ask AI advisor..."
                onKeyDown={e => e.key==='Enter' && getAiAdvice(e.target.value)}
                style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'8px 10px', color:'#e2e8f0', fontSize:'11px', outline:'none'}}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}