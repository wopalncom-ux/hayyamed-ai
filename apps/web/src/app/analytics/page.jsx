'use client'
import NavSidebar from '@/components/NavSidebar'
import { useState } from 'react'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const messages = [120, 185, 140, 220, 175, 90, 200]
const contacts = [45, 62, 38, 85, 70, 30, 95]
const revenue = [2500, 4200, 3100, 5800, 4500, 1800, 6200]

const channels = [
  { name:'WhatsApp', value:45, color:'#00e5a0' },
  { name:'Instagram', value:25, color:'#3b82f6' },
  { name:'Facebook', value:18, color:'#a78bfa' },
  { name:'Telegram', value:8, color:'#f97316' },
  { name:'Email', value:4, color:'#fbbf24' },
]

const maxMsg = Math.max(...messages)

export default function Analytics() {
  const [period, setPeriod] = useState('7days')
  const [metric, setMetric] = useState('messages')

  const chartData = metric === 'messages' ? messages : metric === 'contacts' ? contacts : revenue
  const maxVal = Math.max(...chartData)

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>

      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
        <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700'}}>A</div>
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
                <button key={p} onClick={() => setPeriod(p)} style={{padding:'6px 12px', background: period===p ? '#00e5a0' : '#111622', border:'1px solid #1a2235', borderRadius:'4px', color: period===p ? '#07090f' : '#7a8fa6', fontSize:'11px', cursor:'pointer', fontWeight: period===p ? '700' : '400'}}>
                  {p === '7days' ? '7 Days' : p === '30days' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Cards */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px'}}>
            {[
              {label:'TOTAL MESSAGES', value:'1,130', change:'+18%', color:'#00e5a0'},
              {label:'NEW CONTACTS', value:'425', change:'+24%', color:'#3b82f6'},
              {label:'AI RESPONSES', value:'876', change:'+31%', color:'#a78bfa'},
              {label:'REVENUE', value:'QAR 28.1K', change:'+21%', color:'#f97316'},
            ].map((k,i) => (
              <div key={i} style={{background:'#0f1520', border:'1px solid #1a2235', padding:'16px', borderTop:`2px solid ${k.color}`}}>
                <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', marginBottom:'8px'}}>{k.label}</div>
                <div style={{fontSize:'24px', fontWeight:'800'}}>{k.value}</div>
                <div style={{fontSize:'11px', marginTop:'4px', color:'#00e5a0'}}>↑ {k.change} this week</div>
              </div>
            ))}
          </div>

          {/* Main Chart */}
          <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px'}}>
              <div style={{fontWeight:'700', fontSize:'13px'}}>Performance Overview</div>
              <div style={{display:'flex', gap:'6px'}}>
                {['messages','contacts','revenue'].map(m => (
                  <button key={m} onClick={() => setMetric(m)} style={{padding:'5px 10px', background: metric===m ? '#00e5a0' : '#111622', border:'1px solid #1a2235', borderRadius:'4px', color: metric===m ? '#07090f' : '#7a8fa6', fontSize:'10px', cursor:'pointer', fontWeight: metric===m ? '700' : '400', textTransform:'capitalize'}}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Bar Chart */}
            <div style={{display:'flex', alignItems:'flex-end', gap:'8px', height:'160px', marginBottom:'8px'}}>
              {chartData.map((val, i) => (
                <div key={i} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%', justifyContent:'flex-end', gap:'6px'}}>
                  <div style={{fontSize:'9px', color:'#3d4f63'}}>{val}</div>
                  <div style={{width:'100%', borderRadius:'3px 3px 0 0', background:'linear-gradient(180deg, #00e5a0, #00b37e)', height:`${(val/maxVal)*100}%`, minHeight:'4px', transition:'height .3s'}}></div>
                  <div style={{fontSize:'9px', color:'#3d4f63'}}>{days[i]}</div>
                </div>
              ))}
            </div>
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

            {/* Daily Message Volume */}
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px'}}>
              <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'16px'}}>Daily Message Volume</div>
              {days.map((day, i) => (
                <div key={day} style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                  <div style={{fontSize:'11px', color:'#7a8fa6', width:'30px'}}>{day}</div>
                  <div style={{flex:1, height:'8px', background:'#1a2235', borderRadius:'4px', overflow:'hidden'}}>
                    <div style={{height:'100%', width:`${(messages[i]/maxMsg)*100}%`, background:'linear-gradient(90deg, #00e5a0, #3b82f6)', borderRadius:'4px'}}></div>
                  </div>
                  <div style={{fontSize:'11px', color:'#e2e8f0', width:'30px', textAlign:'right'}}>{messages[i]}</div>
                </div>
              ))}
            </div>

          </div>

          {/* AI Performance */}
          <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px'}}>
            <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'16px'}}>AI Performance</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px'}}>
              {[
                {label:'Response Rate', value:'94%', color:'#00e5a0'},
                {label:'Avg Response Time', value:'1.2s', color:'#3b82f6'},
                {label:'Customer Satisfaction', value:'4.8/5', color:'#a78bfa'},
                {label:'Handoff to Human', value:'6%', color:'#f97316'},
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
