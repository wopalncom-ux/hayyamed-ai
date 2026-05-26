'use client'
import { useState } from 'react'
import NavSidebar from '@/components/NavSidebar'

const reportData = [
  { id:1, name:'Ahmed Al Rashid', phone:'+974 5551 2345', status:'Hot Lead', channel:'WhatsApp', service:'Dental Checkup', campaign:'Ramadan 2024', date:'2024-03-15', booked:'Yes', source:'WhatsApp' },
  { id:2, name:'Fatima Hassan', phone:'+974 5552 3456', status:'Customer', channel:'Instagram', service:'Consultation', campaign:'Summer Sale', date:'2024-06-01', booked:'Yes', source:'Instagram' },
  { id:3, name:'Mohammed Al Ali', phone:'+974 5553 4567', status:'Cold Lead', channel:'WhatsApp', service:'Surgery', campaign:'Ramadan 2024', date:'2024-03-20', booked:'No', source:'WhatsApp' },
  { id:4, name:'Sara Al Kuwari', phone:'+974 5554 5678', status:'Hot Lead', channel:'Facebook', service:'Checkup', campaign:'Eid Special', date:'2024-04-10', booked:'No', source:'Facebook' },
  { id:5, name:'Khalid Al Thani', phone:'+974 5555 6789', status:'Customer', channel:'WhatsApp', service:'Dental Checkup', campaign:'Summer Sale', date:'2024-06-15', booked:'Yes', source:'WhatsApp' },
  { id:6, name:'Mariam Al Dosari', phone:'+974 5556 7890', status:'Prospect', channel:'Telegram', service:'Consultation', campaign:'Ramadan 2024', date:'2024-03-18', booked:'No', source:'Telegram' },
  { id:7, name:'Omar Al Kuwari', phone:'+974 5557 1111', status:'Hot Lead', channel:'WhatsApp', service:'Whitening', campaign:'Eid Special', date:'2024-04-12', booked:'Yes', source:'WhatsApp' },
  { id:8, name:'Lana Hassan', phone:'+974 5557 2222', status:'Customer', channel:'Instagram', service:'Checkup', campaign:'Summer Sale', date:'2024-06-10', booked:'Yes', source:'Instagram' },
]

const campaigns = ['All Campaigns', 'Ramadan 2024', 'Summer Sale', 'Eid Special']
const channels = ['All Channels', 'WhatsApp', 'Instagram', 'Facebook', 'Telegram']
const statuses = ['All Status', 'Hot Lead', 'Cold Lead', 'Customer', 'Prospect']
const services = ['All Services', 'Dental Checkup', 'Consultation', 'Surgery', 'Checkup', 'Whitening']

const statusColors = { 'Hot Lead':'#ef4444', 'Customer':'#00e5a0', 'Cold Lead':'#3b82f6', 'Prospect':'#f97316' }
const channelIcons = { 'WhatsApp':'💬', 'Instagram':'📸', 'Facebook':'👤', 'Telegram':'✈️' }
const channelColors = { 'WhatsApp':'#00e5a0', 'Instagram':'#a78bfa', 'Facebook':'#3b82f6', 'Telegram':'#f97316' }

export default function Reports() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [campaign, setCampaign] = useState('All Campaigns')
  const [channel, setChannel] = useState('All Channels')
  const [status, setStatus] = useState('All Status')
  const [service, setService] = useState('All Services')
  const [search, setSearch] = useState('')
  const [view, setView] = useState('table')
  const [aiQuery, setAiQuery] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAI, setShowAI] = useState(false)

  const filtered = reportData.filter(d => {
    const matchCampaign = campaign === 'All Campaigns' || d.campaign === campaign
    const matchChannel = channel === 'All Channels' || d.channel === channel
    const matchStatus = status === 'All Status' || d.status === status
    const matchService = service === 'All Services' || d.service === service
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search)
    const matchFrom = !fromDate || d.date >= fromDate
    const matchTo = !toDate || d.date <= toDate
    return matchCampaign && matchChannel && matchStatus && matchService && matchSearch && matchFrom && matchTo
  })

  const totalLeads = filtered.length
  const booked = filtered.filter(d => d.booked === 'Yes').length
  const bookingRate = totalLeads > 0 ? Math.round((booked/totalLeads)*100) : 0

  const channelStats = channels.slice(1).map(ch => ({
    name: ch,
    count: filtered.filter(d => d.channel === ch).length,
    color: channelColors[ch]
  })).filter(c => c.count > 0)

  const statusStats = statuses.slice(1).map(st => ({
    name: st,
    count: filtered.filter(d => d.status === st).length,
    color: statusColors[st]
  })).filter(s => s.count > 0)

  const maxChannel = Math.max(...channelStats.map(c => c.count), 1)

  const askAI = async (query) => {
    setAiLoading(true)
    setAiResponse('')
    try {
      const summary = `
        Total leads: ${totalLeads}
        Booked: ${booked} (${bookingRate}%)
        By channel: ${channelStats.map(c => `${c.name}: ${c.count}`).join(', ')}
        By status: ${statusStats.map(s => `${s.name}: ${s.count}`).join(', ')}
        Campaigns: ${[...new Set(filtered.map(d => d.campaign))].join(', ')}
      `
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${query}\n\nReport Data:\n${summary}\n\nDetailed leads:\n${filtered.slice(0,5).map(d => `${d.name} - ${d.status} - ${d.channel} - ${d.service} - Booked: ${d.booked}`).join('\n')}`,
          history: [{ role:'system', content:'You are a CRM report assistant for Qatar market. Analyze data and give clear insights. Do not mention money amounts. Focus on leads, bookings, channels and performance.' }]
        })
      })
      const data = await res.json()
      setAiResponse(data.reply)
    } catch {
      setAiResponse('AI assistant is not available right now.')
    }
    setAiLoading(false)
  }

  const exportCSV = () => {
    const headers = ['Name', 'Phone', 'Status', 'Channel', 'Service', 'Campaign', 'Date', 'Booked']
    const rows = filtered.map(d => [d.name, d.phone, d.status, d.channel, d.service, d.campaign, d.date, d.booked])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hayyamed-report-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const printReport = () => window.print()

  const shareReport = () => {
    const text = `Hayyamed AI Report\n\nTotal Leads: ${totalLeads}\nBooked: ${booked}\nBooking Rate: ${bookingRate}%\nChannels: ${channelStats.map(c => `${c.name}: ${c.count}`).join(', ')}`
    if (navigator.share) {
      navigator.share({ title: 'Hayyamed AI Report', text })
    } else {
      navigator.clipboard.writeText(text)
      alert('Report copied to clipboard!')
    }
  }

  const sendWhatsApp = () => {
    const text = encodeURIComponent(`*Hayyamed AI Report*\n\nTotal Leads: ${totalLeads}\nBooked: ${booked}\nBooking Rate: ${bookingRate}%\n\nTop Channel: ${channelStats[0]?.name || 'N/A'}\n\nGenerated by Hayyamed AI`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const quickReports = [
    'What is my best performing channel?',
    'How can I improve my booking rate?',
    'Which campaign brought the most leads?',
    'Give me a summary of all leads',
    'What service is most popular?',
    'Compare WhatsApp vs Instagram performance',
  ]

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>

      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <img src="/logo.svg" alt="Hayyamed" style={{height:'40px', width:'auto'}} />
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
        <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700'}}>A</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>

        <NavSidebar current="reports" />

        <div style={{flex:1, display:'flex', overflow:'hidden'}}>

          <div style={{flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'16px'}}>

            {/* Header */}
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px'}}>
              <div>
                <div style={{fontWeight:'800', fontSize:'20px'}}>Reports</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginTop:'3px'}}>Filter, analyze and export your data</div>
              </div>
              <div style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
                <button onClick={() => setShowAI(!showAI)} style={{padding:'7px 12px', background: showAI ? '#a78bfa' : 'rgba(167,139,250,.1)', border:'1px solid rgba(167,139,250,.3)', borderRadius:'4px', color: showAI ? '#07090f' : '#a78bfa', fontSize:'11px', cursor:'pointer', fontWeight:'600'}}>🤖 AI Assistant</button>
                <button onClick={exportCSV} style={{padding:'7px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer'}}>📥 CSV</button>
                <button onClick={printReport} style={{padding:'7px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer'}}>🖨️ Print</button>
                <button onClick={sendWhatsApp} style={{padding:'7px 12px', background:'rgba(0,229,160,.1)', border:'1px solid rgba(0,229,160,.2)', borderRadius:'4px', color:'#00e5a0', fontSize:'11px', cursor:'pointer'}}>💬 WhatsApp</button>
                <button onClick={shareReport} style={{padding:'7px 12px', background:'rgba(59,130,246,.1)', border:'1px solid rgba(59,130,246,.2)', borderRadius:'4px', color:'#3b82f6', fontSize:'11px', cursor:'pointer'}}>🔗 Share</button>
              </div>
            </div>

            {/* Filters */}
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'16px', borderRadius:'4px'}}>
              <div style={{fontSize:'10px', color:'#3d4f63', letterSpacing:'2px', marginBottom:'12px'}}>FILTERS</div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'10px'}}>
                <div>
                  <div style={{fontSize:'10px', color:'#7a8fa6', marginBottom:'5px'}}>FROM DATE</div>
                  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'8px 10px', color:'#e2e8f0', fontSize:'11px', outline:'none'}}/>
                </div>
                <div>
                  <div style={{fontSize:'10px', color:'#7a8fa6', marginBottom:'5px'}}>TO DATE</div>
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'8px 10px', color:'#e2e8f0', fontSize:'11px', outline:'none'}}/>
                </div>
                <div>
                  <div style={{fontSize:'10px', color:'#7a8fa6', marginBottom:'5px'}}>SEARCH</div>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or phone..." style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'8px 10px', color:'#e2e8f0', fontSize:'11px', outline:'none'}}/>
                </div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px'}}>
                {[
                  {label:'CAMPAIGN', value:campaign, setter:setCampaign, options:campaigns},
                  {label:'CHANNEL', value:channel, setter:setChannel, options:channels},
                  {label:'STATUS', value:status, setter:setStatus, options:statuses},
                  {label:'SERVICE', value:service, setter:setService, options:services},
                ].map(f => (
                  <div key={f.label}>
                    <div style={{fontSize:'10px', color:'#7a8fa6', marginBottom:'5px'}}>{f.label}</div>
                    <select value={f.value} onChange={e => f.setter(e.target.value)} style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'8px 10px', color:'#e2e8f0', fontSize:'11px', outline:'none', cursor:'pointer'}}>
                      {f.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary KPIs */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px'}}>
              {[
                {label:'TOTAL LEADS', value:totalLeads, color:'#00e5a0'},
                {label:'BOOKED', value:booked, color:'#3b82f6'},
                {label:'BOOKING RATE', value:`${bookingRate}%`, color:'#a78bfa'},
                {label:'NOT BOOKED', value:totalLeads-booked, color:'#f97316'},
              ].map((k,i) => (
                <div key={i} style={{background:'#0f1520', border:'1px solid #1a2235', padding:'14px', borderTop:`2px solid ${k.color}`}}>
                  <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px', marginBottom:'6px'}}>{k.label}</div>
                  <div style={{fontSize:'22px', fontWeight:'800', color:k.color}}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* View Toggle */}
            <div style={{display:'flex', gap:'6px'}}>
              {[
                {id:'table', label:'📋 Table'},
                {id:'charts', label:'📊 Charts'},
                {id:'summary', label:'📄 Summary'},
              ].map(v => (
                <button key={v.id} onClick={() => setView(v.id)} style={{padding:'6px 14px', background: view===v.id ? '#00e5a0' : '#111622', border:'1px solid #1a2235', borderRadius:'4px', color: view===v.id ? '#07090f' : '#7a8fa6', fontSize:'11px', cursor:'pointer', fontWeight: view===v.id ? '700' : '400'}}>
                  {v.label}
                </button>
              ))}
            </div>

            {/* Table View */}
            {view === 'table' && (
              <div style={{background:'#0f1520', border:'1px solid #1a2235', borderRadius:'4px', overflow:'hidden'}}>
                <div style={{display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 1fr 0.8fr', padding:'10px 16px', borderBottom:'1px solid #1a2235', background:'#0c0f1a'}}>
                  {['NAME','PHONE','STATUS','CHANNEL','SERVICE','CAMPAIGN','BOOKED'].map(h => (
                    <div key={h} style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px'}}>{h}</div>
                  ))}
                </div>
                {filtered.length === 0 ? (
                  <div style={{padding:'40px', textAlign:'center', color:'#3d4f63'}}>No records found</div>
                ) : filtered.map(d => (
                  <div key={d.id} style={{display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 1fr 0.8fr', padding:'10px 16px', borderBottom:'1px solid #1a2235', alignItems:'center'}}>
                    <div style={{fontSize:'12px', fontWeight:'600'}}>{d.name}</div>
                    <div style={{fontSize:'11px', color:'#7a8fa6'}}>{d.phone}</div>
                    <div><span style={{fontSize:'10px', padding:'2px 7px', borderRadius:'2px', background:`${statusColors[d.status]}20`, color:statusColors[d.status]}}>{d.status}</span></div>
                    <div style={{fontSize:'12px'}}>{channelIcons[d.channel]}</div>
                    <div style={{fontSize:'11px', color:'#a78bfa'}}>{d.service}</div>
                    <div style={{fontSize:'11px', color:'#7a8fa6'}}>{d.campaign}</div>
                    <div style={{fontSize:'11px', fontWeight:'700', color: d.booked==='Yes' ? '#00e5a0' : '#ef4444'}}>{d.booked==='Yes' ? '✅' : '❌'}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Charts View */}
            {view === 'charts' && (
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>

                {/* Channel Chart */}
                <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px', borderRadius:'4px'}}>
                  <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'16px'}}>Leads by Channel</div>
                  {channelStats.map(ch => (
                    <div key={ch.name} style={{marginBottom:'12px'}}>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                        <div style={{fontSize:'12px', color:'#7a8fa6'}}>{channelIcons[ch.name]} {ch.name}</div>
                        <div style={{fontSize:'12px', fontWeight:'700', color:ch.color}}>{ch.count}</div>
                      </div>
                      <div style={{height:'8px', background:'#1a2235', borderRadius:'4px', overflow:'hidden'}}>
                        <div style={{height:'100%', width:`${(ch.count/maxChannel)*100}%`, background:ch.color, borderRadius:'4px', transition:'width .5s'}}></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status Chart */}
                <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px', borderRadius:'4px'}}>
                  <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'16px'}}>Leads by Status</div>
                  {statusStats.map(st => (
                    <div key={st.name} style={{marginBottom:'12px'}}>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                        <div style={{fontSize:'12px', color:'#7a8fa6'}}>{st.name}</div>
                        <div style={{fontSize:'12px', fontWeight:'700', color:st.color}}>{st.count}</div>
                      </div>
                      <div style={{height:'8px', background:'#1a2235', borderRadius:'4px', overflow:'hidden'}}>
                        <div style={{height:'100%', width:`${(st.count/totalLeads)*100}%`, background:st.color, borderRadius:'4px'}}></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Booking Chart */}
                <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px', borderRadius:'4px'}}>
                  <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'16px'}}>Booking Performance</div>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'24px', height:'120px'}}>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:'40px', fontWeight:'800', color:'#00e5a0'}}>{bookingRate}%</div>
                      <div style={{fontSize:'11px', color:'#7a8fa6'}}>Booking Rate</div>
                    </div>
                    <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <div style={{width:'12px', height:'12px', borderRadius:'2px', background:'#00e5a0'}}></div>
                        <div style={{fontSize:'11px', color:'#7a8fa6'}}>Booked: {booked}</div>
                      </div>
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <div style={{width:'12px', height:'12px', borderRadius:'2px', background:'#ef4444'}}></div>
                        <div style={{fontSize:'11px', color:'#7a8fa6'}}>Not Booked: {totalLeads-booked}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Chart */}
                <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px', borderRadius:'4px'}}>
                  <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'16px'}}>Popular Services</div>
                  {services.slice(1).map((sv, i) => {
                    const count = filtered.filter(d => d.service === sv).length
                    if (!count) return null
                    return (
                      <div key={sv} style={{marginBottom:'10px'}}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                          <div style={{fontSize:'11px', color:'#7a8fa6'}}>{sv}</div>
                          <div style={{fontSize:'11px', fontWeight:'700', color:'#a78bfa'}}>{count}</div>
                        </div>
                        <div style={{height:'6px', background:'#1a2235', borderRadius:'3px', overflow:'hidden'}}>
                          <div style={{height:'100%', width:`${(count/totalLeads)*100}%`, background:'#a78bfa', borderRadius:'3px'}}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Summary View */}
            {view === 'summary' && (
              <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'4px'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px'}}>
                  <div>
                    <div style={{fontWeight:'800', fontSize:'18px'}}>Report Summary</div>
                    <div style={{fontSize:'11px', color:'#7a8fa6', marginTop:'3px'}}>Generated by Hayyamed AI · {new Date().toLocaleDateString()}</div>
                  </div>
                  <div style={{fontSize:'32px'}}>📄</div>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px'}}>
                  {[
                    {label:'Total Leads', value:totalLeads},
                    {label:'Booked', value:booked},
                    {label:'Booking Rate', value:`${bookingRate}%`},
                  ].map(s => (
                    <div key={s.label} style={{padding:'14px', background:'#111622', borderRadius:'4px', textAlign:'center'}}>
                      <div style={{fontSize:'24px', fontWeight:'800', color:'#00e5a0'}}>{s.value}</div>
                      <div style={{fontSize:'11px', color:'#3d4f63', marginTop:'4px'}}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{marginBottom:'16px'}}>
                  <div style={{fontSize:'12px', fontWeight:'700', marginBottom:'10px', color:'#7a8fa6'}}>CHANNEL BREAKDOWN:</div>
                  {channelStats.map(ch => (
                    <div key={ch.name} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #1a2235'}}>
                      <div style={{fontSize:'12px'}}>{channelIcons[ch.name]} {ch.name}</div>
                      <div style={{fontSize:'12px', fontWeight:'700', color:ch.color}}>{ch.count} leads</div>
                    </div>
                  ))}
                </div>

                <div style={{marginBottom:'20px'}}>
                  <div style={{fontSize:'12px', fontWeight:'700', marginBottom:'10px', color:'#7a8fa6'}}>STATUS BREAKDOWN:</div>
                  {statusStats.map(st => (
                    <div key={st.name} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #1a2235'}}>
                      <div style={{fontSize:'12px'}}>{st.name}</div>
                      <div style={{fontSize:'12px', fontWeight:'700', color:st.color}}>{st.count}</div>
                    </div>
                  ))}
                </div>

                <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                  <button onClick={exportCSV} style={{padding:'8px 16px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'11px', cursor:'pointer'}}>📥 Export CSV</button>
                  <button onClick={printReport} style={{padding:'8px 16px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer'}}>🖨️ Print PDF</button>
                  <button onClick={sendWhatsApp} style={{padding:'8px 16px', background:'rgba(0,229,160,.1)', border:'1px solid rgba(0,229,160,.2)', borderRadius:'4px', color:'#00e5a0', fontSize:'11px', cursor:'pointer'}}>💬 Send WhatsApp</button>
                  <button onClick={shareReport} style={{padding:'8px 16px', background:'rgba(59,130,246,.1)', border:'1px solid rgba(59,130,246,.2)', borderRadius:'4px', color:'#3b82f6', fontSize:'11px', cursor:'pointer'}}>🔗 Share Link</button>
                </div>
              </div>
            )}

          </div>

          {/* AI Assistant Panel */}
          {showAI && (
            <div style={{width:'300px', borderLeft:'1px solid #1a2235', background:'#0c0f1a', display:'flex', flexDirection:'column', flexShrink:0}}>
              <div style={{padding:'14px 16px', borderBottom:'1px solid #1a2235'}}>
                <div style={{fontWeight:'700', fontSize:'13px', color:'#a78bfa'}}>🤖 AI Report Assistant</div>
                <div style={{fontSize:'10px', color:'#3d4f63', marginTop:'2px'}}>Ask anything about your report</div>
              </div>

              <div style={{padding:'12px', borderBottom:'1px solid #1a2235'}}>
                <div style={{fontSize:'10px', color:'#3d4f63', marginBottom:'8px'}}>QUICK QUESTIONS:</div>
                {quickReports.map(q => (
                  <button key={q} onClick={() => { setAiQuery(q); askAI(q) }} style={{display:'block', width:'100%', textAlign:'left', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'10px', cursor:'pointer', marginBottom:'5px', lineHeight:'1.4'}}>
                    💡 {q}
                  </button>
                ))}
              </div>

              <div style={{flex:1, padding:'12px', display:'flex', flexDirection:'column', gap:'8px', overflowY:'auto'}}>
                {aiLoading && (
                  <div style={{padding:'12px', background:'rgba(167,139,250,.05)', border:'1px solid rgba(167,139,250,.2)', borderRadius:'4px', fontSize:'11px', color:'#a78bfa'}}>
                    🤖 Analyzing your report data...
                  </div>
                )}
                {aiResponse && !aiLoading && (
                  <div style={{padding:'14px', background:'rgba(167,139,250,.05)', border:'1px solid rgba(167,139,250,.2)', borderRadius:'4px', fontSize:'11px', color:'#e2e8f0', lineHeight:'1.7', whiteSpace:'pre-wrap'}}>
                    {aiResponse}
                  </div>
                )}
              </div>

              <div style={{padding:'12px', borderTop:'1px solid #1a2235'}}>
                <div style={{display:'flex', gap:'6px'}}>
                  <input
                    value={aiQuery}
                    onChange={e => setAiQuery(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && askAI(aiQuery)}
                    placeholder="Ask AI assistant..."
                    style={{flex:1, background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'8px 10px', color:'#e2e8f0', fontSize:'11px', outline:'none'}}
                  />
                  <button onClick={() => askAI(aiQuery)} style={{padding:'8px 12px', background:'#a78bfa', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'11px', cursor:'pointer'}}>Ask</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}