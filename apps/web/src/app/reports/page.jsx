'use client'
import { useState } from 'react'

const data = [
  { id:1, name:'Ahmed Al Rashid', service:'CRM Pro', campaign:'Ramadan 2024', date:'2024-03-15', revenue:'QAR 2,500', messages:45, status:'Active', channel:'WhatsApp' },
  { id:2, name:'Fatima Hassan', service:'Starter', campaign:'New Year', date:'2024-01-10', revenue:'QAR 800', messages:12, status:'Active', channel:'Instagram' },
  { id:3, name:'Mohammed Al Ali', service:'Enterprise', campaign:'Ramadan 2024', date:'2024-03-20', revenue:'QAR 8,000', messages:120, status:'Active', channel:'WhatsApp' },
  { id:4, name:'Sara Al Kuwari', service:'CRM Pro', campaign:'Summer Sale', date:'2024-06-01', revenue:'QAR 2,500', messages:33, status:'Inactive', channel:'Facebook' },
  { id:5, name:'Khalid Al Thani', service:'Enterprise', campaign:'New Year', date:'2024-01-15', revenue:'QAR 8,000', messages:200, status:'Active', channel:'WhatsApp' },
  { id:6, name:'Mariam Al Dosari', service:'Starter', campaign:'Summer Sale', date:'2024-06-10', revenue:'QAR 800', messages:8, status:'Active', channel:'Telegram' },
  { id:7, name:'Omar Al Kuwari', service:'CRM Pro', campaign:'Ramadan 2024', date:'2024-03-18', revenue:'QAR 2,500', messages:67, status:'Active', channel:'WhatsApp' },
  { id:8, name:'Lana Al Thani', service:'Enterprise', campaign:'Summer Sale', date:'2024-06-15', revenue:'QAR 8,000', messages:150, status:'Inactive', channel:'Instagram' },
]

const services = ['All Services', 'Starter', 'CRM Pro', 'Enterprise']
const campaigns = ['All Campaigns', 'Ramadan 2024', 'New Year', 'Summer Sale']
const statuses = ['All Status', 'Active', 'Inactive']

export default function Reports() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [service, setService] = useState('All Services')
  const [campaign, setCampaign] = useState('All Campaigns')
  const [status, setStatus] = useState('All Status')
  const [search, setSearch] = useState('')

  const filtered = data.filter(d => {
    const matchService = service === 'All Services' || d.service === service
    const matchCampaign = campaign === 'All Campaigns' || d.campaign === campaign
    const matchStatus = status === 'All Status' || d.status === status
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase())
    const matchFrom = !fromDate || d.date >= fromDate
    const matchTo = !toDate || d.date <= toDate
    return matchService && matchCampaign && matchStatus && matchSearch && matchFrom && matchTo
  })

  const totalRevenue = filtered.reduce((sum, d) => sum + parseInt(d.revenue.replace(/[^0-9]/g,'')), 0)
  const totalMessages = filtered.reduce((sum, d) => sum + d.messages, 0)

  const exportCSV = () => {
    const headers = ['Name', 'Service', 'Campaign', 'Date', 'Revenue', 'Messages', 'Status', 'Channel']
    const rows = filtered.map(d => [d.name, d.service, d.campaign, d.date, d.revenue, d.messages, d.status, d.channel])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hayyamed-report-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const inputStyle = {background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'8px 12px', color:'#e2e8f0', fontSize:'12px', outline:'none'}
  const selectStyle = {background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'8px 12px', color:'#e2e8f0', fontSize:'12px', outline:'none', cursor:'pointer'}

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>

      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
        <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700'}}>A</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>

        <div style={{width:'56px', background:'#0c0f1a', borderRight:'1px solid #1a2235', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:'8px', flexShrink:0}}>
          <a href="/dashboard" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>⊞</a>
          <a href="/inbox" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>💬</a>
          <a href="/contacts" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>👥</a>
          <a href="/reports" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,229,160,.1)', fontSize:'18px', textDecoration:'none'}}>📊</a>
          <a href="/chatbot" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>🤖</a>
          <a href="/settings" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>⚙️</a>
        </div>

        <div style={{flex:1, overflowY:'auto', padding:'24px', display:'flex', flexDirection:'column', gap:'20px'}}>

          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:'800', fontSize:'20px'}}>Reports</div>
              <div style={{fontSize:'12px', color:'#7a8fa6', marginTop:'3px'}}>Filter and export your data</div>
            </div>
            <button onClick={exportCSV} style={{padding:'10px 20px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>
              📥 Export CSV
            </button>
          </div>

          {/* Filters */}
          <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px', borderRadius:'4px'}}>
            <div style={{fontSize:'11px', color:'#3d4f63', letterSpacing:'2px', marginBottom:'16px'}}>FILTERS</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'12px'}}>
              <div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>FROM DATE</div>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{...inputStyle, width:'100%'}}/>
              </div>
              <div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>TO DATE</div>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{...inputStyle, width:'100%'}}/>
              </div>
              <div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>SEARCH BY NAME</div>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name..." style={{...inputStyle, width:'100%'}}/>
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px'}}>
              <div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>SERVICE</div>
                <select value={service} onChange={e => setService(e.target.value)} style={{...selectStyle, width:'100%'}}>
                  {services.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>CAMPAIGN</div>
                <select value={campaign} onChange={e => setCampaign(e.target.value)} style={{...selectStyle, width:'100%'}}>
                  {campaigns.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>STATUS</div>
                <select value={status} onChange={e => setStatus(e.target.value)} style={{...selectStyle, width:'100%'}}>
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px'}}>
            {[
              {label:'TOTAL RECORDS', value:filtered.length, color:'#00e5a0'},
              {label:'TOTAL REVENUE', value:`QAR ${totalRevenue.toLocaleString()}`, color:'#3b82f6'},
              {label:'TOTAL MESSAGES', value:totalMessages.toLocaleString(), color:'#a78bfa'},
              {label:'ACTIVE CLIENTS', value:filtered.filter(d=>d.status==='Active').length, color:'#f97316'},
            ].map((k,i) => (
              <div key={i} style={{background:'#0f1520', border:'1px solid #1a2235', padding:'16px', borderTop:`2px solid ${k.color}`}}>
                <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', marginBottom:'8px'}}>{k.label}</div>
                <div style={{fontSize:'22px', fontWeight:'800'}}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{background:'#0f1520', border:'1px solid #1a2235', borderRadius:'4px', overflow:'hidden'}}>
            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1.5fr 1fr 1fr 1fr 1fr 1fr', padding:'10px 18px', borderBottom:'1px solid #1a2235', background:'#0c0f1a'}}>
              {['NAME','SERVICE','CAMPAIGN','DATE','REVENUE','MESSAGES','STATUS','CHANNEL'].map(h => (
                <div key={h} style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', fontWeight:'700'}}>{h}</div>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div style={{padding:'40px', textAlign:'center', color:'#3d4f63'}}>No records found</div>
            ) : (
              filtered.map(d => (
                <div key={d.id} style={{display:'grid', gridTemplateColumns:'2fr 1fr 1.5fr 1fr 1fr 1fr 1fr 1fr', padding:'12px 18px', borderBottom:'1px solid #1a2235', alignItems:'center'}}>
                  <div style={{fontSize:'12px', fontWeight:'600'}}>{d.name}</div>
                  <div style={{fontSize:'11px', color:'#7a8fa6'}}>{d.service}</div>
                  <div style={{fontSize:'11px', color:'#7a8fa6'}}>{d.campaign}</div>
                  <div style={{fontSize:'11px', color:'#7a8fa6'}}>{d.date}</div>
                  <div style={{fontSize:'12px', color:'#00e5a0', fontWeight:'600'}}>{d.revenue}</div>
                  <div style={{fontSize:'12px', color:'#7a8fa6'}}>{d.messages}</div>
                  <div>
                    <span style={{fontSize:'10px', padding:'3px 8px', borderRadius:'2px', background: d.status==='Active' ? 'rgba(0,229,160,.1)' : 'rgba(239,68,68,.1)', color: d.status==='Active' ? '#00e5a0' : '#ef4444'}}>{d.status}</span>
                  </div>
                  <div style={{fontSize:'11px', color:'#7a8fa6'}}>{d.channel}</div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  )
}