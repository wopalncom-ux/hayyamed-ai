'use client'
import { useState } from 'react'

const contacts = [
  { id:1, name:'Ahmed Al Rashid', phone:'+974 5551 2345', email:'ahmed@company.qa', status:'Hot Lead', value:'QAR 15,000', channel:'WhatsApp', avatar:'AR', color:'#00e5a0', tags:['VIP','Qatar'] },
  { id:2, name:'Fatima Hassan', phone:'+974 5552 3456', email:'fatima@gmail.com', status:'Customer', value:'QAR 8,500', channel:'Instagram', avatar:'FH', color:'#3b82f6', tags:['Retail'] },
  { id:3, name:'Mohammed Al Ali', phone:'+974 5553 4567', email:'m.ali@business.qa', status:'Cold Lead', value:'QAR 25,000', channel:'WhatsApp', avatar:'MA', color:'#a78bfa', tags:['Enterprise'] },
  { id:4, name:'Sara Al Kuwari', phone:'+974 5554 5678', email:'sara@email.com', status:'Hot Lead', value:'QAR 5,200', channel:'Facebook', avatar:'SK', color:'#f97316', tags:['SME'] },
  { id:5, name:'Khalid Al Thani', phone:'+974 5555 6789', email:'khalid@corp.qa', status:'Customer', value:'QAR 42,000', channel:'WhatsApp', avatar:'KT', color:'#ef4444', tags:['VIP','Enterprise'] },
  { id:6, name:'Mariam Al Dosari', phone:'+974 5556 7890', email:'mariam@gmail.com', status:'Prospect', value:'QAR 3,800', channel:'Telegram', avatar:'MD', color:'#fbbf24', tags:['Retail'] },
]

const statusColors = { 'Hot Lead':'#ef4444', 'Customer':'#00e5a0', 'Cold Lead':'#3b82f6', 'Prospect':'#f97316' }

export default function Contacts() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.status.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>

      {/* Topbar */}
      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
        <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700'}}>A</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>

        {/* Sidebar */}
        <div style={{width:'56px', background:'#0c0f1a', borderRight:'1px solid #1a2235', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:'8px', flexShrink:0}}>
          {['⊞','💬','👥','📊','🤖','⚙️'].map((icon, i) => (
            <div key={i} style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background: i===2 ? 'rgba(0,229,160,.1)' : 'none', fontSize:'18px'}}>
              {icon}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div style={{flex:1, display:'flex', overflow:'hidden'}}>

          {/* Contacts Table */}
          <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>

            {/* Toolbar */}
            <div style={{padding:'12px 18px', borderBottom:'1px solid #1a2235', background:'#0c0f1a', display:'flex', alignItems:'center', gap:'10px'}}>
              <div style={{fontWeight:'700', fontSize:'15px'}}>Contacts <span style={{color:'#3d4f63', fontSize:'12px', fontWeight:'400'}}>{contacts.length} total</span></div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search contacts..."
                style={{marginLeft:'auto', width:'220px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'7px 12px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}
              />
              <button style={{padding:'7px 14px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>+ Add Contact</button>
            </div>

            {/* Table Header */}
            <div style={{display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 1fr 1fr 1fr', padding:'10px 18px', borderBottom:'1px solid #1a2235', background:'#0c0f1a'}}>
              {['NAME','PHONE','STATUS','VALUE','CHANNEL','TAGS'].map(h => (
                <div key={h} style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', fontWeight:'700'}}>{h}</div>
              ))}
            </div>

            {/* Table Rows */}
            <div style={{flex:1, overflowY:'auto'}}>
              {filtered.map(c => (
                <div key={c.id} onClick={() => setSelected(c)} style={{display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 1fr 1fr 1fr', padding:'12px 18px', borderBottom:'1px solid #1a2235', cursor:'pointer', background: selected?.id===c.id ? '#0f1520' : 'none', alignItems:'center', transition:'all .2s'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <div style={{width:'32px', height:'32px', borderRadius:'50%', background:c.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', color:'#07090f', flexShrink:0}}>{c.avatar}</div>
                    <div>
                      <div style={{fontSize:'12px', fontWeight:'600'}}>{c.name}</div>
                      <div style={{fontSize:'11px', color:'#7a8fa6'}}>{c.email}</div>
                    </div>
                  </div>
                  <div style={{fontSize:'12px', color:'#7a8fa6'}}>{c.phone}</div>
                  <div><span style={{fontSize:'10px', padding:'3px 8px', borderRadius:'2px', background:`${statusColors[c.status]}20`, color:statusColors[c.status], fontWeight:'600'}}>{c.status}</span></div>
                  <div style={{fontSize:'12px', color:'#00e5a0', fontWeight:'600'}}>{c.value}</div>
                  <div style={{fontSize:'12px', color:'#7a8fa6'}}>{c.channel}</div>
                  <div style={{display:'flex', gap:'4px', flexWrap:'wrap'}}>
                    {c.tags.map(t => (
                      <span key={t} style={{fontSize:'9px', padding:'2px 6px', borderRadius:'2px', background:'#111622', border:'1px solid #1a2235', color:'#7a8fa6'}}>{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Detail Panel */}
          {selected && (
            <div style={{width:'260px', borderLeft:'1px solid #1a2235', background:'#0c0f1a', padding:'20px', overflowY:'auto', flexShrink:0}}>
              <div style={{textAlign:'center', marginBottom:'16px'}}>
                <div style={{width:'56px', height:'56px', borderRadius:'50%', background:selected.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:'700', color:'#07090f', margin:'0 auto 10px'}}>{selected.avatar}</div>
                <div style={{fontWeight:'700', fontSize:'14px'}}>{selected.name}</div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginTop:'3px'}}>{selected.status}</div>
              </div>
              {[
                {label:'Phone', value:selected.phone},
                {label:'Email', value:selected.email},
                {label:'Channel', value:selected.channel},
                {label:'Value', value:selected.value},
              ].map(f => (
                <div key={f.label} style={{marginBottom:'12px'}}>
                  <div style={{fontSize:'10px', color:'#3d4f63', marginBottom:'3px'}}>{f.label}</div>
                  <div style={{fontSize:'12px', color:'#e2e8f0'}}>{f.value}</div>
                </div>
              ))}
              <button style={{width:'100%', padding:'8px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer', marginTop:'8px'}}>💬 Send Message</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}