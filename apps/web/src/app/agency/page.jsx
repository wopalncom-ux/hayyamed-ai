'use client'
import { useState } from 'react'

const initialClients = [
  { id:1, name:'Elite Medical Center', type:'Healthcare', logo:'🏥', color:'#00e5a0', status:'good', contacts:1247, messages:3420, revenue:'QAR 8,000', plan:'Enterprise', wa:'Connected', lastActive:'2 min ago', ai:94 },
  { id:2, name:'Mazaj Lounge Cafe', type:'F&B', logo:'☕', color:'#3b82f6', status:'good', contacts:892, messages:2100, revenue:'QAR 2,500', plan:'CRM Pro', wa:'Connected', lastActive:'15 min ago', ai:87 },
  { id:3, name:'Doctors In Qatar', type:'Healthcare', logo:'👨‍⚕️', color:'#a78bfa', status:'warn', contacts:534, messages:890, revenue:'QAR 2,500', plan:'CRM Pro', wa:'Warning', lastActive:'1 hour ago', ai:76 },
  { id:4, name:'LGS Group', type:'Retail', logo:'🛍️', color:'#f97316', status:'good', contacts:2341, messages:5670, revenue:'QAR 8,000', plan:'Enterprise', wa:'Connected', lastActive:'5 min ago', ai:91 },
  { id:5, name:'Lifestyle Qatar', type:'Fashion', logo:'👗', color:'#ef4444', status:'alert', contacts:234, messages:120, revenue:'QAR 800', plan:'Starter', wa:'Disconnected', lastActive:'2 days ago', ai:45 },
  { id:6, name:'Magadir Gallery', type:'Art', logo:'🎨', color:'#fbbf24', status:'good', contacts:456, messages:780, revenue:'QAR 2,500', plan:'CRM Pro', wa:'Connected', lastActive:'30 min ago', ai:82 },
]

const statusColors = { good:'#00e5a0', warn:'#fbbf24', alert:'#ef4444' }
const logos = ['🏢','🏥','☕','🛍️','👗','🎨','🏪','🏬','🍕','💊']

export default function Agency() {
  const [clients, setClients] = useState(initialClients)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newClient, setNewClient] = useState({name:'', type:'', plan:'CRM Pro', logo:'🏢'})

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.type.toLowerCase().includes(search.toLowerCase()))

  const totalRevenue = clients.reduce((sum, c) => sum + parseInt(c.revenue.replace(/[^0-9]/g,'')), 0)
  const totalContacts = clients.reduce((sum, c) => sum + c.contacts, 0)
  const totalMessages = clients.reduce((sum, c) => sum + c.messages, 0)

  const addClient = () => {
    if (!newClient.name || !newClient.type) return
    const client = {
      id: clients.length + 1,
      name: newClient.name,
      type: newClient.type,
      logo: newClient.logo,
      color: '#00e5a0',
      status: 'good',
      contacts: 0,
      messages: 0,
      revenue: newClient.plan === 'Starter' ? 'QAR 800' : newClient.plan === 'CRM Pro' ? 'QAR 2,500' : 'QAR 8,000',
      plan: newClient.plan,
      wa: 'Disconnected',
      lastActive: 'Just now',
      ai: 0,
    }
    setClients([...clients, client])
    setShowAdd(false)
    setNewClient({name:'', type:'', plan:'CRM Pro', logo:'🏢'})
  }

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>

      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{fontSize:'12px', color:'#7a8fa6'}}>/ Agency View</div>
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
        <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700'}}>A</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>

        <div style={{width:'56px', background:'#0c0f1a', borderRight:'1px solid #1a2235', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:'8px', flexShrink:0}}>
          <a href="/dashboard" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>⊞</a>
          <a href="/inbox" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>💬</a>
          <a href="/contacts" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>👥</a>
          <a href="/reports" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>📊</a>
          <a href="/campaigns" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>📣</a>
          <a href="/chatbot" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>🤖</a>
          <a href="/notifications" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>🔔</a>
          <a href="/agency" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,229,160,.1)', fontSize:'18px', textDecoration:'none'}}>🏢</a>
          <a href="/settings" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>⚙️</a>
        </div>

        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>

          <div style={{padding:'12px 18px', borderBottom:'1px solid #1a2235', background:'#0c0f1a', display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'1px'}}>
            {[
              {label:'TOTAL CLIENTS', value:clients.length},
              {label:'TOTAL CONTACTS', value:totalContacts.toLocaleString()},
              {label:'TOTAL MESSAGES', value:totalMessages.toLocaleString()},
              {label:'MONTHLY REVENUE', value:`QAR ${totalRevenue.toLocaleString()}`},
              {label:'ACTIVE NOW', value:clients.filter(c=>c.status==='good').length},
            ].map((k,i) => (
              <div key={i} style={{textAlign:'center', padding:'8px'}}>
                <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px', marginBottom:'4px'}}>{k.label}</div>
                <div style={{fontSize:'16px', fontWeight:'800'}}>{k.value}</div>
              </div>
            ))}
          </div>

          <div style={{padding:'12px 18px', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', gap:'10px'}}>
            <div style={{fontWeight:'700', fontSize:'15px'}}>Client Accounts</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." style={{marginLeft:'auto', width:'220px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'7px 12px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}/>
            <button onClick={() => setShowAdd(true)} style={{padding:'7px 14px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>+ Add Client</button>
          </div>

          <div style={{flex:1, display:'flex', overflow:'hidden'}}>

            <div style={{flex:1, overflowY:'auto', padding:'18px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', alignContent:'start'}}>
              {filtered.map(c => (
                <div key={c.id} onClick={() => setSelected(c)} style={{background:'#0f1520', border:'1px solid', borderColor: selected?.id===c.id ? c.color : '#1a2235', borderLeft:`3px solid ${statusColors[c.status]}`, padding:'18px', cursor:'pointer', transition:'all .2s'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px'}}>
                    <div style={{width:'38px', height:'38px', borderRadius:'6px', background:c.color+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0}}>{c.logo}</div>
                    <div>
                      <div style={{fontWeight:'700', fontSize:'13px'}}>{c.name}</div>
                      <div style={{fontSize:'10px', color:'#7a8fa6'}}>{c.type}</div>
                    </div>
                    <div style={{marginLeft:'auto', width:'8px', height:'8px', borderRadius:'50%', background:statusColors[c.status]}}></div>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'14px'}}>
                    {[
                      {label:'CONTACTS', value:c.contacts.toLocaleString()},
                      {label:'MESSAGES', value:c.messages.toLocaleString()},
                      {label:'AI SCORE', value:`${c.ai}%`},
                    ].map(s => (
                      <div key={s.label} style={{textAlign:'center'}}>
                        <div style={{fontSize:'14px', fontWeight:'800', color:c.color}}>{s.value}</div>
                        <div style={{fontSize:'8px', color:'#3d4f63', letterSpacing:'1px'}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'5px', fontSize:'10px'}}>
                      <div style={{width:'6px', height:'6px', borderRadius:'50%', background: c.wa==='Connected' ? '#00e5a0' : c.wa==='Warning' ? '#fbbf24' : '#ef4444'}}></div>
                      <span style={{color:'#7a8fa6'}}>{c.wa}</span>
                    </div>
                    <div style={{display:'flex', gap:'4px'}}>
                      <button style={{height:'24px', padding:'0 10px', borderRadius:'3px', fontSize:'10px', border:'1px solid #1a2235', background:'#111622', color:'#7a8fa6', cursor:'pointer'}}>View</button>
                      <button style={{height:'24px', padding:'0 10px', borderRadius:'3px', fontSize:'10px', border:'none', background:c.color, color:'#07090f', cursor:'pointer', fontWeight:'700'}}>Manage</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selected && (
              <div style={{width:'260px', borderLeft:'1px solid #1a2235', background:'#0c0f1a', padding:'20px', overflowY:'auto', flexShrink:0}}>
                <div style={{textAlign:'center', marginBottom:'20px'}}>
                  <div style={{width:'56px', height:'56px', borderRadius:'10px', background:selected.color+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', margin:'0 auto 10px'}}>{selected.logo}</div>
                  <div style={{fontWeight:'700', fontSize:'14px'}}>{selected.name}</div>
                  <div style={{fontSize:'11px', color:'#7a8fa6', marginTop:'3px'}}>{selected.type} · {selected.plan}</div>
                </div>
                {[
                  {label:'Revenue', value:selected.revenue},
                  {label:'Contacts', value:selected.contacts.toLocaleString()},
                  {label:'Messages', value:selected.messages.toLocaleString()},
                  {label:'WhatsApp', value:selected.wa},
                  {label:'Last Active', value:selected.lastActive},
                  {label:'AI Score', value:`${selected.ai}%`},
                ].map(f => (
                  <div key={f.label} style={{marginBottom:'12px', paddingBottom:'12px', borderBottom:'1px solid #1a2235'}}>
                    <div style={{fontSize:'10px', color:'#3d4f63', marginBottom:'3px'}}>{f.label}</div>
                    <div style={{fontSize:'12px', color:'#e2e8f0', fontWeight:'600'}}>{f.value}</div>
                  </div>
                ))}
                <button style={{width:'100%', padding:'8px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer', marginBottom:'8px'}}>💬 Open Inbox</button>
                <button style={{width:'100%', padding:'8px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>📊 View Reports</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAdd && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,.8)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'32px', borderRadius:'4px', width:'420px'}}>
            <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'6px'}}>Add New Client</div>
            <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'24px'}}>Fill in the client details below</div>

            <div style={{marginBottom:'16px'}}>
              <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'8px'}}>CHOOSE LOGO</div>
              <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                {logos.map(l => (
                  <div key={l} onClick={() => setNewClient({...newClient, logo:l})} style={{width:'36px', height:'36px', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', cursor:'pointer', background: newClient.logo===l ? 'rgba(0,229,160,.2)' : '#111622', border:'1px solid', borderColor: newClient.logo===l ? '#00e5a0' : '#1a2235'}}>
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {[
              {label:'COMPANY NAME', key:'name', placeholder:'e.g. Al Meera Markets'},
              {label:'BUSINESS TYPE', key:'type', placeholder:'e.g. Retail, Healthcare, F&B'},
            ].map(f => (
              <div key={f.key} style={{marginBottom:'16px'}}>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>{f.label}</div>
                <input value={newClient[f.key]} onChange={e => setNewClient({...newClient, [f.key]:e.target.value})} placeholder={f.placeholder} style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}/>
              </div>
            ))}

            <div style={{marginBottom:'24px'}}>
              <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>PLAN</div>
              <select value={newClient.plan} onChange={e => setNewClient({...newClient, plan:e.target.value})} style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none', cursor:'pointer'}}>
                <option>Starter — QAR 800/mo</option>
                <option>CRM Pro — QAR 2,500/mo</option>
                <option>Enterprise — QAR 8,000/mo</option>
              </select>
            </div>

            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={() => setShowAdd(false)} style={{flex:1, padding:'10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'12px', cursor:'pointer'}}>Cancel</button>
              <button onClick={addClient} style={{flex:1, padding:'10px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>✅ Add Client</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}