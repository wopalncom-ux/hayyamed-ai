'use client'
import { useState } from 'react'

const contacts = [
  { id:1, name:'Ahmed Al Rashid', phone:'+974 5551 2345', channel:'WhatsApp', status:'Active', tags:['VIP','Qatar'] },
  { id:2, name:'Fatima Hassan', phone:'+974 5552 3456', channel:'Instagram', status:'Active', tags:['Retail'] },
  { id:3, name:'Mohammed Al Ali', phone:'+974 5553 4567', channel:'WhatsApp', status:'Active', tags:['Enterprise'] },
  { id:4, name:'Sara Al Kuwari', phone:'+974 5554 5678', channel:'WhatsApp', status:'Active', tags:['SME'] },
  { id:5, name:'Khalid Al Thani', phone:'+974 5555 6789', channel:'WhatsApp', status:'Active', tags:['VIP'] },
  { id:6, name:'Mariam Al Dosari', phone:'+974 5556 7890', channel:'Telegram', status:'Active', tags:['Retail'] },
]

const campaigns = [
  { id:1, name:'Ramadan 2024', status:'Completed', sent:1234, opened:890, clicked:234, date:'2024-03-15', channel:'WhatsApp' },
  { id:2, name:'New Year Offer', status:'Completed', sent:567, opened:432, clicked:123, date:'2024-01-01', channel:'WhatsApp' },
  { id:3, name:'Summer Sale', status:'Active', sent:890, opened:654, clicked:321, date:'2024-06-01', channel:'Instagram' },
  { id:4, name:'Eid Special', status:'Draft', sent:0, opened:0, clicked:0, date:'2024-04-10', channel:'WhatsApp' },
]

const statusColors = { 'Completed':'#00e5a0', 'Active':'#3b82f6', 'Draft':'#f97316' }

export default function Campaigns() {
  const [tab, setTab] = useState('list')
  const [campaignName, setCampaignName] = useState('')
  const [message, setMessage] = useState('')
  const [channel, setChannel] = useState('WhatsApp')
  const [selectedContacts, setSelectedContacts] = useState([])
  const [sent, setSent] = useState(false)

  const toggleContact = (id) => {
    setSelectedContacts(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const selectAll = () => {
    setSelectedContacts(selectedContacts.length === contacts.length ? [] : contacts.map(c => c.id))
  }

  const sendCampaign = () => {
    if (!campaignName || !message || selectedContacts.length === 0) return
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

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
          <a href="/reports" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>📊</a>
          <a href="/campaigns" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,229,160,.1)', fontSize:'18px', textDecoration:'none'}}>📣</a>
          <a href="/chatbot" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>🤖</a>
          <a href="/settings" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>⚙️</a>
        </div>

        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>

          <div style={{padding:'12px 18px', borderBottom:'1px solid #1a2235', background:'#0c0f1a', display:'flex', alignItems:'center', gap:'12px'}}>
            <div style={{fontWeight:'700', fontSize:'15px'}}>Campaign Manager</div>
            <div style={{display:'flex', gap:'8px', marginLeft:'auto'}}>
              <button onClick={() => setTab('list')} style={{padding:'6px 14px', background: tab==='list' ? '#00e5a0' : '#111622', border:'1px solid #1a2235', borderRadius:'4px', color: tab==='list' ? '#07090f' : '#7a8fa6', fontSize:'11px', cursor:'pointer', fontWeight: tab==='list' ? '700' : '400'}}>📋 Campaigns</button>
              <button onClick={() => setTab('create')} style={{padding:'6px 14px', background: tab==='create' ? '#00e5a0' : '#111622', border:'1px solid #1a2235', borderRadius:'4px', color: tab==='create' ? '#07090f' : '#7a8fa6', fontSize:'11px', cursor:'pointer', fontWeight: tab==='create' ? '700' : '400'}}>+ New Campaign</button>
            </div>
          </div>

          <div style={{flex:1, overflowY:'auto', padding:'20px'}}>

            {tab === 'list' && (
              <div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px'}}>
                  {[
                    {label:'TOTAL CAMPAIGNS', value:campaigns.length, color:'#00e5a0'},
                    {label:'TOTAL SENT', value:'2,691', color:'#3b82f6'},
                    {label:'AVG OPEN RATE', value:'72%', color:'#a78bfa'},
                  ].map((k,i) => (
                    <div key={i} style={{background:'#0f1520', border:'1px solid #1a2235', padding:'16px', borderTop:`2px solid ${k.color}`}}>
                      <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', marginBottom:'8px'}}>{k.label}</div>
                      <div style={{fontSize:'22px', fontWeight:'800'}}>{k.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{background:'#0f1520', border:'1px solid #1a2235', borderRadius:'4px', overflow:'hidden'}}>
                  <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr', padding:'10px 18px', borderBottom:'1px solid #1a2235', background:'#0c0f1a'}}>
                    {['CAMPAIGN','STATUS','SENT','OPENED','CLICKED','CHANNEL'].map(h => (
                      <div key={h} style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', fontWeight:'700'}}>{h}</div>
                    ))}
                  </div>
                  {campaigns.map(c => (
                    <div key={c.id} style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr', padding:'12px 18px', borderBottom:'1px solid #1a2235', alignItems:'center'}}>
                      <div>
                        <div style={{fontSize:'12px', fontWeight:'600'}}>{c.name}</div>
                        <div style={{fontSize:'10px', color:'#3d4f63'}}>{c.date}</div>
                      </div>
                      <div><span style={{fontSize:'10px', padding:'3px 8px', borderRadius:'2px', background:`${statusColors[c.status]}20`, color:statusColors[c.status]}}>{c.status}</span></div>
                      <div style={{fontSize:'12px', color:'#7a8fa6'}}>{c.sent.toLocaleString()}</div>
                      <div style={{fontSize:'12px', color:'#00e5a0'}}>{c.opened.toLocaleString()}</div>
                      <div style={{fontSize:'12px', color:'#3b82f6'}}>{c.clicked.toLocaleString()}</div>
                      <div style={{fontSize:'12px', color:'#7a8fa6'}}>{c.channel}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'create' && (
              <div style={{maxWidth:'700px'}}>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'6px'}}>Create New Campaign</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'24px'}}>Send bulk messages to your contacts</div>

                {sent && (
                  <div style={{padding:'14px', background:'rgba(0,229,160,.1)', border:'1px solid rgba(0,229,160,.3)', borderRadius:'4px', marginBottom:'20px', color:'#00e5a0', fontWeight:'600'}}>
                    ✅ Campaign sent successfully to {selectedContacts.length} contacts!
                  </div>
                )}

                <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'4px', marginBottom:'16px'}}>
                  <div style={{marginBottom:'16px'}}>
                    <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>CAMPAIGN NAME</div>
                    <input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g. Ramadan 2024 Offer" style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}/>
                  </div>

                  <div style={{marginBottom:'16px'}}>
                    <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>CHANNEL</div>
                    <select value={channel} onChange={e => setChannel(e.target.value)} style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none', cursor:'pointer'}}>
                      <option>WhatsApp</option>
                      <option>Instagram</option>
                      <option>Facebook</option>
                      <option>Telegram</option>
                      <option>Email</option>
                    </select>
                  </div>

                  <div style={{marginBottom:'16px'}}>
                    <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>MESSAGE</div>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Type your message here... You can use {name} to personalize" style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none', resize:'vertical'}}/>
                    <div style={{fontSize:'10px', color:'#3d4f63', marginTop:'4px'}}>Tip: Use {'{name}'} to personalize the message for each contact</div>
                  </div>
                </div>

                <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'4px', marginBottom:'16px'}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px'}}>
                    <div style={{fontSize:'11px', color:'#7a8fa6'}}>SELECT CONTACTS ({selectedContacts.length} selected)</div>
                    <button onClick={selectAll} style={{fontSize:'11px', color:'#00e5a0', background:'none', border:'none', cursor:'pointer'}}>
                      {selectedContacts.length === contacts.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  {contacts.map(c => (
                    <div key={c.id} onClick={() => toggleContact(c.id)} style={{display:'flex', alignItems:'center', gap:'12px', padding:'10px', borderRadius:'4px', cursor:'pointer', background: selectedContacts.includes(c.id) ? 'rgba(0,229,160,.05)' : 'none', border:'1px solid', borderColor: selectedContacts.includes(c.id) ? 'rgba(0,229,160,.2)' : 'transparent', marginBottom:'6px'}}>
                      <div style={{width:'18px', height:'18px', borderRadius:'3px', border:'1px solid', borderColor: selectedContacts.includes(c.id) ? '#00e5a0' : '#1a2235', background: selectedContacts.includes(c.id) ? '#00e5a0' : 'none', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color:'#07090f', flexShrink:0}}>
                        {selectedContacts.includes(c.id) ? '✓' : ''}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'12px', fontWeight:'600'}}>{c.name}</div>
                        <div style={{fontSize:'10px', color:'#7a8fa6'}}>{c.phone} · {c.channel}</div>
                      </div>
                      <div style={{display:'flex', gap:'4px'}}>
                        {c.tags.map(t => (
                          <span key={t} style={{fontSize:'9px', padding:'2px 6px', background:'#111622', border:'1px solid #1a2235', borderRadius:'2px', color:'#7a8fa6'}}>{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={sendCampaign} style={{width:'100%', padding:'12px', background: selectedContacts.length > 0 && campaignName && message ? '#00e5a0' : '#1a2235', border:'none', borderRadius:'4px', color: selectedContacts.length > 0 && campaignName && message ? '#07090f' : '#3d4f63', fontWeight:'700', fontSize:'13px', cursor:'pointer'}}>
                  🚀 Send Campaign to {selectedContacts.length} Contacts
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}