'use client'
import { useState } from 'react'

const initialContacts = [
  { id:1, name:'Ahmed Al Rashid', phone:'+974 5551 2345', email:'ahmed@company.qa', status:'Hot Lead', channel:'WhatsApp', avatar:'AR', color:'#00e5a0', tags:['VIP','Qatar'], services:['Dental Checkup','Whitening'], source:'WhatsApp', score:9, lastContact:'2 min ago', followUp:'2024-06-20', notes:'Very interested in dental package' },
  { id:2, name:'Fatima Hassan', phone:'+974 5552 3456', email:'fatima@gmail.com', status:'Customer', channel:'Instagram', avatar:'FH', color:'#3b82f6', tags:['Retail'], services:['Consultation'], source:'Instagram', score:7, lastContact:'15 min ago', followUp:'', notes:'' },
  { id:3, name:'Mohammed Al Ali', phone:'+974 5553 4567', email:'m.ali@business.qa', status:'Cold Lead', channel:'WhatsApp', avatar:'MA', color:'#a78bfa', tags:['Enterprise'], services:['Surgery','Follow Up'], source:'WhatsApp', score:4, lastContact:'1 hour ago', followUp:'2024-06-25', notes:'Needs follow up next week' },
  { id:4, name:'Sara Al Kuwari', phone:'+974 5554 5678', email:'sara@email.com', status:'Hot Lead', channel:'Facebook', avatar:'SK', color:'#f97316', tags:['SME'], services:['Checkup'], source:'Facebook', score:8, lastContact:'2 hours ago', followUp:'', notes:'' },
  { id:5, name:'Khalid Al Thani', phone:'+974 5555 6789', email:'khalid@corp.qa', status:'Customer', channel:'WhatsApp', avatar:'KT', color:'#ef4444', tags:['VIP','Enterprise'], services:['Dental Checkup','Surgery'], source:'WhatsApp', score:6, lastContact:'3 hours ago', followUp:'', notes:'' },
  { id:6, name:'Mariam Al Dosari', phone:'+974 5556 7890', email:'mariam@gmail.com', status:'Prospect', channel:'Telegram', avatar:'MD', color:'#fbbf24', tags:['Retail'], services:['Consultation'], source:'Telegram', score:5, lastContact:'5 hours ago', followUp:'2024-06-22', notes:'' },
]

const statusColors = { 'Hot Lead':'#ef4444', 'Customer':'#00e5a0', 'Cold Lead':'#3b82f6', 'Prospect':'#f97316' }
const channelIcons = { 'WhatsApp':'💬', 'Instagram':'📸', 'Facebook':'👤', 'Telegram':'✈️', 'Email':'📧' }
const servicesList = ['Dental Checkup', 'Whitening', 'Surgery', 'Consultation', 'Follow Up', 'X-Ray', 'Cleaning', 'Braces']

export default function Contacts() {
  const [contacts, setContacts] = useState(initialContacts)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterChannel, setFilterChannel] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showImportPreview, setShowImportPreview] = useState(false)
  const [previewContacts, setPreviewContacts] = useState([])
  const [duplicates, setDuplicates] = useState([])
  const [uploadedFile, setUploadedFile] = useState(null)
  const [tab, setTab] = useState('list')

  const [newContact, setNewContact] = useState({
    phone:'', name:'', email:'', status:'New Lead', channel:'WhatsApp', services:[], notes:''
  })

  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.services.join(' ').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'All' || c.status === filterStatus
    const matchChannel = filterChannel === 'All' || c.channel === filterChannel
    return matchSearch && matchStatus && matchChannel
  })

  const addContact = () => {
    if (!newContact.phone) return alert('Phone number is required!')
    const duplicate = contacts.find(c => c.phone === newContact.phone)
    if (duplicate) return alert(`⚠️ This phone number already exists! (${duplicate.name || duplicate.phone})`)
    const initials = newContact.name ? newContact.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : newContact.phone.slice(-2)
    const colors = ['#00e5a0','#3b82f6','#a78bfa','#f97316','#ef4444','#fbbf24']
    const contact = {
      id: contacts.length + 1,
      name: newContact.name || '',
      phone: newContact.phone,
      email: newContact.email || '',
      status: newContact.status,
      channel: newContact.channel,
      avatar: initials,
      color: colors[Math.floor(Math.random()*colors.length)],
      tags: [],
      services: newContact.services,
      source: newContact.channel,
      score: 5,
      lastContact: 'Just now',
      followUp: '',
      notes: newContact.notes,
    }
    setContacts([contact, ...contacts])
    setShowAdd(false)
    setNewContact({phone:'', name:'', email:'', status:'New Lead', channel:'WhatsApp', services:[], notes:''})
    alert('✅ Contact added successfully!')
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadedFile(file)
    const mockContacts = [
      { phone:'+974 5557 1111', name:'Omar Al Kuwari', email:'' },
      { phone:'+974 5557 2222', name:'', email:'' },
      { phone:'+974 5551 2345', name:'Ahmed Al Rashid', email:'' }, // duplicate
      { phone:'+974 5557 3333', name:'Lana Hassan', email:'lana@email.com' },
      { phone:'+974 5557 4444', name:'', email:'' },
    ]
    const dups = mockContacts.filter(nc => contacts.find(c => c.phone === nc.phone))
    setDuplicates(dups)
    setPreviewContacts(mockContacts)
    setShowImportPreview(true)
  }

  const importContacts = () => {
    const newOnes = previewContacts.filter(nc => !contacts.find(c => c.phone === nc.phone))
    const imported = newOnes.map((c, i) => ({
      id: contacts.length + i + 1,
      name: c.name || '',
      phone: c.phone,
      email: c.email || '',
      status: 'New Lead',
      channel: 'WhatsApp',
      avatar: c.name ? c.name.slice(0,2).toUpperCase() : c.phone.slice(-2),
      color: '#00e5a0',
      tags: [],
      services: [],
      source: 'Import',
      score: 5,
      lastContact: 'Just now',
      followUp: '',
      notes: '',
    }))
    setContacts([...imported, ...contacts])
    setShowImportPreview(false)
    setShowImport(false)
    alert(`✅ ${imported.length} contacts imported! ${duplicates.length} duplicates skipped.`)
  }

  const exportCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Status', 'Channel', 'Services', 'Score', 'Last Contact', 'Notes']
    const rows = filtered.map(c => [c.name, c.phone, c.email, c.status, c.channel, c.services.join(';'), c.score, c.lastContact, c.notes])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contacts-export.csv'
    a.click()
  }

  const toggleService = (service) => {
    const current = newContact.services
    if (current.includes(service)) {
      setNewContact({...newContact, services: current.filter(s => s !== service)})
    } else {
      setNewContact({...newContact, services: [...current, service]})
    }
  }

  const inp = {width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'9px 12px', color:'#e2e8f0', fontSize:'12px', outline:'none', marginBottom:'12px'}
  const sel = {width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'9px 12px', color:'#e2e8f0', fontSize:'12px', outline:'none', marginBottom:'12px', cursor:'pointer'}
  const lbl = {fontSize:'10px', color:'#7a8fa6', marginBottom:'5px', display:'block'}

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
          <a href="/contacts" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,229,160,.1)', fontSize:'18px', textDecoration:'none'}}>👥</a>
          <a href="/analytics" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>📈</a>
          <a href="/reports" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>📊</a>
          <a href="/campaigns" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>📣</a>
          <a href="/chatbot" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>🤖</a>
          <a href="/agency" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>🏢</a>
          <a href="/notifications" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>🔔</a>
          <a href="/settings" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>⚙️</a>
        </div>

        <div style={{flex:1, display:'flex', overflow:'hidden'}}>
          <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>

            {/* Toolbar */}
            <div style={{padding:'10px 18px', borderBottom:'1px solid #1a2235', background:'#0c0f1a', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap'}}>
              <div style={{fontWeight:'700', fontSize:'14px'}}>Contacts <span style={{color:'#3d4f63', fontSize:'12px', fontWeight:'400'}}>{filtered.length} of {contacts.length}</span></div>
              
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, service..." style={{width:'200px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'6px 10px', color:'#e2e8f0', fontSize:'11px', outline:'none'}}/>
              
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'6px 10px', color:'#e2e8f0', fontSize:'11px', outline:'none', cursor:'pointer'}}>
                <option value="All">All Status</option>
                <option>Hot Lead</option>
                <option>Cold Lead</option>
                <option>Customer</option>
                <option>Prospect</option>
                <option>New Lead</option>
              </select>

              <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)} style={{background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'6px 10px', color:'#e2e8f0', fontSize:'11px', outline:'none', cursor:'pointer'}}>
                <option value="All">All Channels</option>
                <option>WhatsApp</option>
                <option>Instagram</option>
                <option>Facebook</option>
                <option>Telegram</option>
              </select>

              <div style={{marginLeft:'auto', display:'flex', gap:'6px'}}>
                <button onClick={exportCSV} style={{padding:'6px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer'}}>📥 Export CSV</button>
                <button onClick={() => setShowImport(true)} style={{padding:'6px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer'}}>📊 Import</button>
                <button onClick={() => setShowAdd(true)} style={{padding:'6px 12px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'11px', cursor:'pointer'}}>+ Add Contact</button>
              </div>
            </div>

            {/* Table Header */}
            <div style={{display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1.5fr 0.8fr', padding:'8px 18px', borderBottom:'1px solid #1a2235', background:'#0c0f1a'}}>
              {['NAME & PHONE','STATUS','CHANNEL','SCORE','SERVICES','LAST CONTACT'].map(h => (
                <div key={h} style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px', fontWeight:'700'}}>{h}</div>
              ))}
            </div>

            {/* Table Rows */}
            <div style={{flex:1, overflowY:'auto'}}>
              {filtered.map(c => (
                <div key={c.id} onClick={() => setSelected(selected?.id===c.id ? null : c)} style={{display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1.5fr 0.8fr', padding:'10px 18px', borderBottom:'1px solid #1a2235', cursor:'pointer', background: selected?.id===c.id ? '#0f1520' : 'none', alignItems:'center', borderLeft: selected?.id===c.id ? '2px solid #00e5a0' : '2px solid transparent'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <div style={{width:'32px', height:'32px', borderRadius:'50%', background:c.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'700', color:'#07090f', flexShrink:0}}>{c.avatar}</div>
                    <div>
                      <div style={{fontSize:'12px', fontWeight:'600'}}>{c.name || <span style={{color:'#3d4f63'}}>No name</span>}</div>
                      <div style={{fontSize:'11px', color:'#7a8fa6'}}>{c.phone}</div>
                    </div>
                  </div>
                  <div><span style={{fontSize:'10px', padding:'3px 8px', borderRadius:'2px', background:`${statusColors[c.status]}20`, color:statusColors[c.status], fontWeight:'600'}}>{c.status}</span></div>
                  <div style={{fontSize:'13px'}}>{channelIcons[c.channel]} <span style={{fontSize:'11px', color:'#7a8fa6'}}>{c.channel}</span></div>
                  <div>
                    <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
                      <div style={{fontSize:'13px', fontWeight:'800', color: c.score >= 7 ? '#00e5a0' : c.score >= 4 ? '#f97316' : '#ef4444'}}>{c.score}</div>
                      <div style={{fontSize:'9px', color:'#3d4f63'}}>/10</div>
                    </div>
                  </div>
                  <div style={{display:'flex', gap:'3px', flexWrap:'wrap'}}>
                    {c.services.slice(0,2).map(s => (
                      <span key={s} style={{fontSize:'9px', padding:'2px 5px', background:'rgba(167,139,250,.1)', border:'1px solid rgba(167,139,250,.2)', borderRadius:'2px', color:'#a78bfa'}}>{s}</span>
                    ))}
                    {c.services.length > 2 && <span style={{fontSize:'9px', color:'#3d4f63'}}>+{c.services.length-2}</span>}
                  </div>
                  <div style={{fontSize:'10px', color:'#3d4f63'}}>{c.lastContact}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Detail Panel */}
          {selected && (
            <div style={{width:'280px', borderLeft:'1px solid #1a2235', background:'#0c0f1a', padding:'20px', overflowY:'auto', flexShrink:0}}>
              <div style={{textAlign:'center', marginBottom:'16px'}}>
                <div style={{width:'56px', height:'56px', borderRadius:'50%', background:selected.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:'700', color:'#07090f', margin:'0 auto 10px'}}>{selected.avatar}</div>
                <div style={{fontWeight:'700', fontSize:'14px'}}>{selected.name || 'No name'}</div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginTop:'3px'}}>{selected.status}</div>
                <div style={{display:'flex', justifyContent:'center', gap:'6px', marginTop:'8px'}}>
                  <div style={{width:'8px', height:'8px', borderRadius:'50%', background: selected.score >= 7 ? '#00e5a0' : selected.score >= 4 ? '#f97316' : '#ef4444'}}></div>
                  <span style={{fontSize:'10px', color:'#7a8fa6'}}>Lead Score: {selected.score}/10</span>
                </div>
              </div>

              {[
                {label:'Phone', value:selected.phone},
                {label:'Email', value:selected.email || '—'},
                {label:'Channel', value:`${channelIcons[selected.channel]} ${selected.channel}`},
                {label:'Source', value:selected.source},
                {label:'Last Contact', value:selected.lastContact},
                {label:'Follow Up', value:selected.followUp || '—'},
              ].map(f => (
                <div key={f.label} style={{marginBottom:'10px', paddingBottom:'10px', borderBottom:'1px solid #1a2235'}}>
                  <div style={{fontSize:'9px', color:'#3d4f63', marginBottom:'2px'}}>{f.label}</div>
                  <div style={{fontSize:'12px', color:'#e2e8f0'}}>{f.value}</div>
                </div>
              ))}

              {selected.services.length > 0 && (
                <div style={{marginBottom:'12px'}}>
                  <div style={{fontSize:'9px', color:'#3d4f63', marginBottom:'6px'}}>SERVICES INTERESTED</div>
                  <div style={{display:'flex', flexWrap:'wrap', gap:'4px'}}>
                    {selected.services.map(s => (
                      <span key={s} style={{fontSize:'10px', padding:'3px 8px', background:'rgba(167,139,250,.1)', border:'1px solid rgba(167,139,250,.2)', borderRadius:'3px', color:'#a78bfa'}}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.notes && (
                <div style={{marginBottom:'12px'}}>
                  <div style={{fontSize:'9px', color:'#3d4f63', marginBottom:'4px'}}>NOTES</div>
                  <div style={{fontSize:'11px', color:'#7a8fa6', lineHeight:'1.5', padding:'8px', background:'#111622', borderRadius:'4px'}}>{selected.notes}</div>
                </div>
              )}

              {selected.tags.length > 0 && (
                <div style={{marginBottom:'12px'}}>
                  <div style={{fontSize:'9px', color:'#3d4f63', marginBottom:'6px'}}>TAGS</div>
                  <div style={{display:'flex', flexWrap:'wrap', gap:'4px'}}>
                    {selected.tags.map(t => (
                      <span key={t} style={{fontSize:'9px', padding:'2px 6px', background:'#111622', border:'1px solid #1a2235', borderRadius:'2px', color:'#7a8fa6'}}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{display:'flex', flexDirection:'column', gap:'6px', marginTop:'12px'}}>
                <button style={{width:'100%', padding:'8px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>💬 Send Message</button>
                <button style={{width:'100%', padding:'8px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'12px', cursor:'pointer'}}>📣 Add to Campaign</button>
                <button style={{width:'100%', padding:'8px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'12px', cursor:'pointer'}}>📝 Edit Contact</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAdd && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,.8)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'28px', borderRadius:'4px', width:'460px', maxHeight:'90vh', overflowY:'auto'}}>
            <div style={{fontWeight:'800', fontSize:'16px', marginBottom:'4px'}}>Add New Contact</div>
            <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'20px'}}>Phone is required — all other fields are optional</div>

            <label style={lbl}>PHONE NUMBER <span style={{color:'#ef4444'}}>*</span></label>
            <input value={newContact.phone} onChange={e => setNewContact({...newContact, phone:e.target.value})} placeholder="+974 5555 0000" style={inp}/>

            <label style={lbl}>FULL NAME (optional)</label>
            <input value={newContact.name} onChange={e => setNewContact({...newContact, name:e.target.value})} placeholder="e.g. Ahmed Al Rashid" style={inp}/>

            <label style={lbl}>EMAIL (optional)</label>
            <input value={newContact.email} onChange={e => setNewContact({...newContact, email:e.target.value})} placeholder="email@example.com" style={inp}/>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
              <div>
                <label style={lbl}>STATUS</label>
                <select value={newContact.status} onChange={e => setNewContact({...newContact, status:e.target.value})} style={sel}>
                  <option>New Lead</option>
                  <option>Hot Lead</option>
                  <option>Cold Lead</option>
                  <option>Customer</option>
                  <option>Prospect</option>
                </select>
              </div>
              <div>
                <label style={lbl}>CHANNEL</label>
                <select value={newContact.channel} onChange={e => setNewContact({...newContact, channel:e.target.value})} style={sel}>
                  <option>WhatsApp</option>
                  <option>Instagram</option>
                  <option>Facebook</option>
                  <option>Telegram</option>
                  <option>Email</option>
                </select>
              </div>
            </div>

            <label style={lbl}>SERVICES INTERESTED (optional)</label>
            <div style={{display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'12px'}}>
              {servicesList.map(s => (
                <button key={s} onClick={() => toggleService(s)} style={{padding:'5px 10px', background: newContact.services.includes(s) ? 'rgba(167,139,250,.2)' : '#111622', border:'1px solid', borderColor: newContact.services.includes(s) ? '#a78bfa' : '#1a2235', borderRadius:'3px', color: newContact.services.includes(s) ? '#a78bfa' : '#7a8fa6', fontSize:'10px', cursor:'pointer'}}>
                  {s}
                </button>
              ))}
            </div>

            <label style={lbl}>NOTES (optional)</label>
            <textarea value={newContact.notes} onChange={e => setNewContact({...newContact, notes:e.target.value})} rows={2} placeholder="Add private notes..." style={{...inp, resize:'vertical'}}/>

            <div style={{display:'flex', gap:'10px', marginTop:'8px'}}>
              <button onClick={() => setShowAdd(false)} style={{flex:1, padding:'10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'12px', cursor:'pointer'}}>Cancel</button>
              <button onClick={addContact} style={{flex:1, padding:'10px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>✅ Add Contact</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,.8)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'28px', borderRadius:'4px', width:'540px', maxHeight:'90vh', overflowY:'auto'}}>
            <div style={{fontWeight:'800', fontSize:'16px', marginBottom:'4px'}}>Import Contacts</div>
            <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'20px'}}>Phone number is required — duplicates will be skipped automatically</div>

            <div style={{border:'2px dashed #1a2235', borderRadius:'4px', padding:'30px', textAlign:'center', cursor:'pointer', background:'#111622', marginBottom:'16px'}} onClick={() => document.getElementById('contactsFile').click()}>
              <div style={{fontSize:'32px', marginBottom:'8px'}}>📊</div>
              <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'4px'}}>Upload Excel or CSV</div>
              <div style={{fontSize:'11px', color:'#7a8fa6'}}>.xlsx, .xls, .csv supported</div>
              <input id="contactsFile" type="file" accept=".csv,.xlsx,.xls" style={{display:'none'}} onChange={handleFileUpload}/>
              {uploadedFile && <div style={{marginTop:'10px', fontSize:'12px', color:'#00e5a0'}}>✅ {uploadedFile.name}</div>}
            </div>

            <div style={{padding:'14px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', marginBottom:'16px'}}>
              <div style={{fontSize:'11px', fontWeight:'600', marginBottom:'8px'}}>Required Format:</div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px'}}>
                {[{col:'phone', req:true},{col:'name', req:false},{col:'email', req:false}].map(f => (
                  <div key={f.col} style={{padding:'8px', background:'#0f1520', border:`1px solid ${f.req ? '#00e5a0' : '#1a2235'}`, borderRadius:'3px', textAlign:'center'}}>
                    <div style={{fontSize:'11px', color: f.req ? '#00e5a0' : '#7a8fa6', fontWeight:'600'}}>{f.col}</div>
                    <div style={{fontSize:'9px', color:'#3d4f63', marginTop:'2px'}}>{f.req ? 'REQUIRED' : 'optional'}</div>
                  </div>
                ))}
              </div>
            </div>

            {showImportPreview && (
              <div style={{background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', overflow:'hidden', marginBottom:'14px'}}>
                <div style={{padding:'10px 14px', borderBottom:'1px solid #1a2235', background:'#0c0f1a', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{fontWeight:'700', fontSize:'12px'}}>{previewContacts.length} contacts found</div>
                  {duplicates.length > 0 && <div style={{fontSize:'10px', color:'#f97316'}}>⚠️ {duplicates.length} duplicates will be skipped</div>}
                </div>
                {previewContacts.map((c, i) => {
                  const isDup = contacts.find(ex => ex.phone === c.phone)
                  return (
                    <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 1fr', padding:'8px 14px', borderBottom:'1px solid #1a2235', background: isDup ? 'rgba(249,115,22,.05)' : 'none', alignItems:'center'}}>
                      <div style={{fontSize:'11px', color: isDup ? '#f97316' : '#00e5a0', fontWeight:'600'}}>{c.phone} {isDup && '(duplicate)'}</div>
                      <div style={{fontSize:'11px', color:'#7a8fa6'}}>{c.name || '—'}</div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={() => { setShowImport(false); setShowImportPreview(false) }} style={{flex:1, padding:'10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'12px', cursor:'pointer'}}>Cancel</button>
              {showImportPreview && (
                <button onClick={importContacts} style={{flex:1, padding:'10px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>
                  ✅ Import {previewContacts.filter(nc => !contacts.find(c => c.phone === nc.phone)).length} New Contacts
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}