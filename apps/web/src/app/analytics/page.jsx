'use client'
import NavSidebar from '@/components/NavSidebar'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

const CHANNEL_COLORS = ['#00e5a0', '#3b82f6', '#a78bfa', '#f97316', '#fbbf24']

const fmt = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n)

export default function Analytics() {
  const [period, setPeriod]   = useState('7days')
  const [metric, setMetric]   = useState('messages')
  const [kpis,   setKpis]     = useState(null)
  const [chart,  setChart]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getDashboard().then(setKpis).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    api.getAnalytics(period)
      .then(d => { setChart(d.days || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const chartData = chart.map(d => metric === 'contacts' ? d.contacts : d.messages)
  const maxVal    = Math.max(...chartData, 1)
  const labels    = chart.map(d => {
    const dt = new Date(d.date)
    return period === '7days'
      ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getUTCDay()]
      : d.date.slice(5)
  })

  const channels = kpis?.channels?.slice(0, 5).map((c, i) => ({
    name: c.channelId ? `Channel ${i+1}` : ['WhatsApp','Instagram','Facebook','Telegram','Email'][i] || `Ch${i+1}`,
    value: kpis.channels.length ? Math.round((c.count / kpis.channels.reduce((s,x) => s+x.count,0)) * 100) : 0,
    color: CHANNEL_COLORS[i] || '#7a8fa6',
  })) || [
    { name:'WhatsApp', value:45, color:'#00e5a0' },
    { name:'Instagram', value:25, color:'#3b82f6' },
    { name:'Facebook', value:18, color:'#a78bfa' },
    { name:'Telegram', value:8, color:'#f97316' },
    { name:'Email', value:4, color:'#fbbf24' },
  ]

  const KPI_CARDS = [
    { label:'TOTAL CONTACTS', value: kpis ? fmt(kpis.totalLeads) : '—', color:'#00e5a0' },
    { label:'CONVERSATIONS',  value: kpis ? fmt(kpis.totalConvs) : '—', color:'#3b82f6' },
    { label:'CONVERSION RATE',value: kpis ? `${kpis.conversionRate}%` : '—', color:'#a78bfa' },
    { label:'BOOKING RATE',   value: kpis ? `${kpis.bookingRate}%` : '—', color:'#f97316' },
  ]

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>

      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>
        <NavSidebar current="analytics" />

        <div style={{flex:1, overflowY:'auto', padding:'24px', display:'flex', flexDirection:'column', gap:'20px'}}>

          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:'800', fontSize:'20px'}}>Analytics</div>
              <div style={{fontSize:'12px', color:'#7a8fa6', marginTop:'3px'}}>Track your growth and performance</div>
            </div>
            <div style={{display:'flex', gap:'6px'}}>
              {['7days','30days','90days'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{padding:'6px 12px', background: period===p ? '#00e5a0' : '#111622', border:'1px solid #1a2235', borderRadius:'4px', color: period===p ? '#07090f' : '#7a8fa6', fontSize:'11px', cursor:'pointer', fontWeight: period===p ? '700' : '400'}}>
                  {p === '7days' ? '7 Days' : p === '30days' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Cards */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px'}}>
            {KPI_CARDS.map((k,i) => (
              <div key={i} style={{background:'#0f1520', border:'1px solid #1a2235', padding:'16px', borderTop:`2px solid ${k.color}`}}>
                <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', marginBottom:'8px'}}>{k.label}</div>
                <div style={{fontSize:'24px', fontWeight:'800'}}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Main Chart */}
          <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px'}}>
              <div style={{fontWeight:'700', fontSize:'13px'}}>Performance Over Time</div>
              <div style={{display:'flex', gap:'6px'}}>
                {['messages','contacts'].map(m => (
                  <button key={m} onClick={() => setMetric(m)}
                    style={{padding:'5px 10px', background: metric===m ? '#00e5a0' : '#111622', border:'1px solid #1a2235', borderRadius:'4px', color: metric===m ? '#07090f' : '#7a8fa6', fontSize:'10px', cursor:'pointer', fontWeight: metric===m ? '700' : '400', textTransform:'capitalize'}}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{height:'160px', display:'flex', alignItems:'center', justifyContent:'center', color:'#3d4f63', fontSize:'12px'}}>Loading chart…</div>
            ) : chartData.length === 0 ? (
              <div style={{height:'160px', display:'flex', alignItems:'center', justifyContent:'center', color:'#3d4f63', fontSize:'12px'}}>No data yet</div>
            ) : (
              <div style={{display:'flex', alignItems:'flex-end', gap:'4px', height:'160px', marginBottom:'8px'}}>
                {chartData.map((val, i) => (
                  <div key={i} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%', justifyContent:'flex-end', gap:'4px'}}>
                    {val > 0 && <div style={{fontSize:'8px', color:'#3d4f63'}}>{val}</div>}
                    <div style={{width:'100%', borderRadius:'3px 3px 0 0', background:'linear-gradient(180deg, #00e5a0, #00b37e)', height:`${(val/maxVal)*100}%`, minHeight: val > 0 ? '4px' : '1px', background: val > 0 ? 'linear-gradient(180deg, #00e5a0, #00b37e)' : '#1a2235', transition:'height .3s'}}></div>
                    {labels.length <= 31 && <div style={{fontSize:'8px', color:'#3d4f63', whiteSpace:'nowrap'}}>{labels[i]}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>

            {/* Channel Distribution */}
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px'}}>
              <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'16px'}}>Channel Distribution</div>
              {channels.map(c => (
                <div key={c.name} style={{marginBottom:'12px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                    <div style={{fontSize:'12px', color:'#7a8fa6'}}>{c.name}</div>
                    <div style={{fontSize:'12px', fontWeight:'600', color:c.color}}>{c.value}%</div>
                  </div>
                  <div style={{height:'6px', background:'#1a2235', borderRadius:'3px', overflow:'hidden'}}>
                    <div style={{height:'100%', width:`${c.value}%`, background:c.color, borderRadius:'3px', transition:'width .5s'}}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Status Breakdown */}
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px'}}>
              <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'16px'}}>Lead Status Breakdown</div>
              {(kpis?.statuses || [
                {status:'NEW_LEAD', count: 0},
                {status:'CONTACTED', count: 0},
                {status:'QUALIFYING', count: 0},
                {status:'WON', count: 0},
              ]).map((s, i) => {
                const total = kpis ? kpis.totalLeads || 1 : 1
                const pct = Math.round((s.count / total) * 100)
                const color = ['#fbbf24','#3b82f6','#a78bfa','#00e5a0','#f97316'][i] || '#7a8fa6'
                return (
                  <div key={s.status} style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                    <div style={{fontSize:'10px', color:'#7a8fa6', width:'90px', textTransform:'capitalize'}}>{s.status.replace(/_/g,' ').toLowerCase()}</div>
                    <div style={{flex:1, height:'8px', background:'#1a2235', borderRadius:'4px', overflow:'hidden'}}>
                      <div style={{height:'100%', width:`${pct}%`, background:color, borderRadius:'4px', transition:'width .5s'}}></div>
                    </div>
                    <div style={{fontSize:'11px', color:'#e2e8f0', width:'28px', textAlign:'right'}}>{s.count}</div>
                  </div>
                )
              })}
            </div>

          </div>

          {/* Summary stats */}
          <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px'}}>
            <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'16px'}}>Summary</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px'}}>
              {[
                {label:'Active Campaigns', value: kpis ? kpis.activeCampaigns : '—', color:'#f97316'},
                {label:'Open Conversations', value: kpis ? kpis.openConvs : '—', color:'#3b82f6'},
                {label:'Won Leads', value: kpis ? kpis.wonLeads : '—', color:'#00e5a0'},
                {label:'Booked', value: kpis ? kpis.booked : '—', color:'#a78bfa'},
              ].map((s,i) => (
                <div key={i} style={{textAlign:'center', padding:'16px', background:'#111622', borderRadius:'4px', border:'1px solid #1a2235'}}>
                  <div style={{fontSize:'22px', fontWeight:'800', color:s.color, marginBottom:'6px'}}>{s.value}</div>
                  <div style={{fontSize:'10px', color:'#3d4f63'}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
