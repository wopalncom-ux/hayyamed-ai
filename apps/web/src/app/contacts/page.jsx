'use client'
import NavSidebar from '@/components/NavSidebar'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useIsMobile } from '@/lib/useIsMobile'

const COLORS = ['#00e5a0','#3b82f6','#a78bfa','#f97316','#ef4444','#fbbf24','#06b6d4']
const toUi = (c) => ({
  ...c,
  avatar: c.name ? c.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : '??',
  color: COLORS[(c.name?.charCodeAt(0) || 0) % COLORS.length],
  channel: c.source || 'WhatsApp',
  services: c.metadata?.services || [],
  lastContact: c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '—',
  followUp: c.metadata?.followUp || '',
})

const statusColors = { 'NEW':'#3b82f6','CONTACTED':'#06b6d4','QUALIFYING':'#f97316','QUALIFIED':'#00e5a0','PROPOSAL':'#a78bfa','WON':'#16a34a','LOST':'#ef4444','Hot Lead':'#ef4444','Customer':'#00e5a0','Cold Lead':'#3b82f6','Prospect':'#f97316','New Lead':'#64748b' }
// Real contact status enum (what the API returns), with display labels.
const STATUS_OPTIONS = [['NEW','New'],['CONTACTED','Contacted'],['QUALIFYING','Qualifying'],['QUALIFIED','Qualified'],['PROPOSAL','Proposal'],['WON','Won'],['LOST','Lost']]
// Contact "source" is stored lowercase (website/whatsapp/instagram/import…); map it
// to a friendly icon/label. Fixes blank icons + a channel filter that matched nothing.
const SOURCE_META = {
  whatsapp:{label:'WhatsApp',icon:'💬'}, website:{label:'Website',icon:'🌐'}, webchat:{label:'Website',icon:'🌐'},
  live_chat:{label:'Website',icon:'🌐'}, instagram:{label:'Instagram',icon:'📸'}, facebook:{label:'Facebook',icon:'👤'},
  messenger:{label:'Messenger',icon:'👤'}, telegram:{label:'Telegram',icon:'✈️'}, email:{label:'Email',icon:'📧'},
  import:{label:'Import',icon:'📥'}, manual:{label:'Manual',icon:'✍️'},
}
const sourceMeta = (s) => SOURCE_META[String(s||'').toLowerCase()] || { label: s || 'Unknown', icon:'•' }
const servicesList = ['Dental Checkup', 'Whitening', 'Surgery', 'Consultation', 'Follow Up', 'X-Ray', 'Cleaning', 'Braces']

export default function Contacts() {
  const isMobile = useIsMobile()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getContacts({ limit: 200 })
      .then(res => setContacts((res.data || []).map(toUi)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])
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
  const [scoringAll, setScoringAll] = useState(false)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkBusy, setBulkBusy] = useState(false)
  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const clearSelection = () => setSelectedIds([])
  const bulkStatus = async (value) => {
    if (!value || selectedIds.length === 0) return
    setBulkBusy(true)
    try {
      await api.bulkContacts(selectedIds, 'status', value)
      setContacts(prev => prev.map(c => selectedIds.includes(c.id) ? { ...c, status: value } : c))
      clearSelection()
    } catch (e) { alert('Bulk update failed: ' + (e?.message || 'error')) }
    finally { setBulkBusy(false) }
  }
  const [bulkTagText, setBulkTagText] = useState('')
  const bulkTag = async () => {
    const tag = bulkTagText.trim()
    if (!tag || selectedIds.length === 0) return
    setBulkBusy(true)
    try {
      await api.bulkContacts(selectedIds, 'tag', tag)
      setContacts(prev => prev.map(c => selectedIds.includes(c.id) && !(c.tags || []).includes(tag) ? { ...c, tags: [...(c.tags || []), tag] } : c))
      setBulkTagText(''); clearSelection()
    } catch (e) { alert('Bulk tag failed: ' + (e?.message || 'error')) }
    finally { setBulkBusy(false) }
  }
  const bulkDelete = async () => {
    if (selectedIds.length === 0 || !confirm(`Delete ${selectedIds.length} contact(s)? This cannot be undone.`)) return
    setBulkBusy(true)
    try {
      await api.bulkContacts(selectedIds, 'delete')
      setContacts(prev => prev.filter(c => !selectedIds.includes(c.id)))
      clearSelection()
    } catch (e) { alert('Bulk delete failed: ' + (e?.message || 'error')) }
    finally { setBulkBusy(false) }
  }

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

  const addContact = async () => {
    if (!newContact.phone) return alert('Phone number is required!')
    try {
      const created = await api.createContact({
        name: newContact.name || '',
        phone: newContact.phone,
        email: newContact.email || '',
        status: 'NEW',
        source: newContact.channel,
        notes: newContact.notes,
        metadata: { services: newContact.services },
      })
      setContacts([toUi(created), ...contacts])
      setShowAdd(false)
      setNewContact({phone:'', name:'', email:'', status:'New Lead', channel:'WhatsApp', services:[], notes:''})
      alert('✅ Contact added successfully!')
    } catch (err) {
      alert('❌ ' + (err.message || 'Failed to add contact'))
    }
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

  const importContacts = async () => {
    const newOnes = previewContacts.filter(nc => !contacts.find(c => c.phone === nc.phone))
    try {
      const results = await Promise.all(newOnes.map(c =>
        api.createContact({ name: c.name || '', phone: c.phone, email: c.email || '', status: 'NEW', source: 'Import' })
      ))
      setContacts([...results.map(toUi), ...contacts])
      setShowImportPreview(false)
      setShowImport(false)
      alert(`✅ ${results.length} contacts imported! ${duplicates.length} duplicates skipped.`)
    } catch (err) {
      alert('❌ ' + (err.message || 'Import failed'))
    }
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

        <NavSidebar current="contacts" />

        <div style={{flex:1, display:'flex', overflow:'hidden'}}>
          <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>

            {/* Toolbar */}
            <div style={{padding:'10px 18px', borderBottom:'1px solid #1a2235', background:'#0c0f1a', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap'}}>
              <div style={{fontWeight:'700', fontSize:'14px'}}>Contacts <span style={{color:'#3d4f63', fontSize:'12px', fontWeight:'400'}}>{filtered.length} of {contacts.length}</span></div>
              
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, service..." style={{width:'200px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'6px 10px', color:'#e2e8f0', fontSize:'11px', outline:'none'}}/>
              
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'6px 10px', color:'#e2e8f0', fontSize:'11px', outline:'none', cursor:'pointer'}}>
                <option value="All">All Status</option>
                {STATUS_OPTIONS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>

              <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)} style={{background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'6px 10px', color:'#e2e8f0', fontSize:'11px', outline:'none', cursor:'pointer'}}>
                <option value="All">All Sources</option>
                {Array.from(new Set(contacts.map(c => c.channel))).map(src => (
                  <option key={src} value={src}>{sourceMeta(src).icon} {sourceMeta(src).label}</option>
                ))}
              </select>

              <div style={{marginLeft:'auto', display:'flex', gap:'6px'}}>
                <button onClick={exportCSV} style={{padding:'6px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer'}}>📥 Export CSV</button>
                <a href="/contacts/import" style={{padding:'6px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer', textDecoration:'none', display:'inline-block'}}>📊 Import CSV</a>
                <button
                  disabled={scoringAll}
                  onClick={async () => {
                    setScoringAll(true)
                    try {
                      const r = await api.scoreAllContacts()
                      alert(`🤖 Scoring ${r.queued} contacts in background. Refresh in ~1 min to see scores.`)
                    } catch (e) { alert('Scoring failed: ' + e.message) }
                    setScoringAll(false)
                  }}
                  style={{padding:'6px 12px', background: scoringAll ? '#1a2235' : 'rgba(139,92,246,.12)', border:'1px solid rgba(139,92,246,.3)', borderRadius:'4px', color:'#8b5cf6', fontWeight:'700', fontSize:'11px', cursor: scoringAll ? 'default' : 'pointer'}}>
                  {scoringAll ? '⏳ Queuing...' : '🤖 Score All'}
                </button>
                <button onClick={() => setShowAdd(true)} style={{padding:'6px 12px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'11px', cursor:'pointer'}}>+ Add Contact</button>
              </div>
            </div>

            {/* Bulk action toolbar */}
            {selectedIds.length > 0 && (
              <div style={{display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', padding:'8px 18px', background:'rgba(0,229,160,.06)', borderBottom:'1px solid rgba(0,229,160,.2)'}}>
                <span style={{fontSize:'12px', fontWeight:'700', color:'#00e5a0'}}>{selectedIds.length} selected</span>
                <select defaultValue="" onChange={e => { bulkStatus(e.target.value); e.target.value = '' }} disabled={bulkBusy}
                  style={{background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'5px 9px', color:'#e2e8f0', fontSize:'11px', cursor:'pointer'}}>
                  <option value="" disabled>Set status…</option>
                  {STATUS_OPTIONS.map(([val,label]) => <option key={val} value={val}>{label}</option>)}
                </select>
                <div style={{display:'flex', gap:'4px', alignItems:'center'}}>
                  <input value={bulkTagText} onChange={e => setBulkTagText(e.target.value)} onKeyDown={e => e.key === 'Enter' && bulkTag()}
                    placeholder="add tag…" disabled={bulkBusy}
                    style={{background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'5px 9px', color:'#e2e8f0', fontSize:'11px', outline:'none', width:'100px'}} />
                  <button onClick={bulkTag} disabled={bulkBusy || !bulkTagText.trim()} style={{padding:'5px 9px', background:'rgba(59,130,246,.12)', border:'1px solid rgba(59,130,246,.3)', borderRadius:'4px', color:'#3b82f6', fontSize:'11px', fontWeight:'700', cursor:'pointer'}}>+ Tag</button>
                </div>
                <button onClick={bulkDelete} disabled={bulkBusy} style={{padding:'5px 11px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'4px', color:'#ef4444', fontSize:'11px', fontWeight:'700', cursor:'pointer'}}>🗑 Delete</button>
                <button onClick={clearSelection} style={{padding:'5px 11px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#94a3b8', fontSize:'11px', cursor:'pointer'}}>Clear</button>
                {bulkBusy && <span style={{fontSize:'11px', color:'#64748b'}}>Working…</span>}
              </div>
            )}

            {/* Table — horizontally scrollable on mobile */}
            <div style={{flex:1, display:'flex', flexDirection:'column', overflowX: isMobile ? 'auto' : 'visible', overflowY:'hidden'}}>
            {/* Table Header */}
            <div style={{display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1.5fr 0.8fr', minWidth: isMobile ? '680px' : 'auto', padding:'8px 18px', borderBottom:'1px solid #1a2235', background:'#0c0f1a'}}>
              {['NAME & PHONE','STATUS','CHANNEL','SCORE','SERVICES','LAST CONTACT'].map(h => (
                <div key={h} style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px', fontWeight:'700'}}>{h}</div>
              ))}
            </div>

            {/* Table Rows */}
            <div style={{flex:1, overflowY:'auto', minWidth: isMobile ? '680px' : 'auto'}}>
              {filtered.map(c => (
                <div key={c.id} onClick={() => c.id && !c.id.startsWith('local-') ? window.location.href = `/contacts/${c.id}` : setSelected(selected?.id===c.id ? null : c)} style={{display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1.5fr 0.8fr', padding:'10px 18px', borderBottom:'1px solid #1a2235', cursor:'pointer', background: selected?.id===c.id ? '#0f1520' : 'none', alignItems:'center', borderLeft: selected?.id===c.id ? '2px solid #00e5a0' : '2px solid transparent'}}
                  onMouseEnter={e => { if (!selected || selected.id !== c.id) e.currentTarget.style.background = '#0f1624' }}
                  onMouseLeave={e => { if (!selected || selected.id !== c.id) e.currentTarget.style.background = 'none' }}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <input type="checkbox" checked={selectedIds.includes(c.id)}
                      onClick={e => e.stopPropagation()} onChange={() => toggleSelect(c.id)}
                      style={{ accentColor:'#00e5a0', width:'15px', height:'15px', cursor:'pointer', flexShrink:0 }} />
                    <div style={{width:'32px', height:'32px', borderRadius:'50%', background:c.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'700', color:'#07090f', flexShrink:0}}>{c.avatar}</div>
                    <div>
                      <div style={{fontSize:'12px', fontWeight:'600'}}>{c.name || <span style={{color:'#3d4f63'}}>No name</span>}</div>
                      <div style={{fontSize:'11px', color:'#7a8fa6'}}>{c.phone}</div>
                    </div>
                  </div>
                  <div><span style={{fontSize:'10px', padding:'3px 8px', borderRadius:'2px', background:`${statusColors[c.status]}20`, color:statusColors[c.status], fontWeight:'600'}}>{c.status}</span></div>
                  <div style={{fontSize:'13px'}}>{sourceMeta(c.channel).icon} <span style={{fontSize:'11px', color:'#7a8fa6'}}>{sourceMeta(c.channel).label}</span></div>
                  <div>
                    <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
                      <div style={{fontSize:'13px', fontWeight:'800', color: !c.score ? '#3d4f63' : c.score >= 80 ? '#22c55e' : c.score >= 60 ? '#00e5a0' : c.score >= 40 ? '#fbbf24' : c.score >= 20 ? '#f97316' : '#ef4444'}}>{c.score || '—'}</div>
                      {c.score > 0 && <div style={{fontSize:'9px', color:'#3d4f63'}}>/100</div>}
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
          </div>

          {/* Contact Detail Panel */}
          {selected && (
            <div style={{width: isMobile ? '100%' : '280px', borderLeft:'1px solid #1a2235', background:'#0c0f1a', padding:'20px', overflowY:'auto', flexShrink:0}}>
              <div style={{textAlign:'center', marginBottom:'16px'}}>
                <div style={{width:'56px', height:'56px', borderRadius:'50%', background:selected.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:'700', color:'#07090f', margin:'0 auto 10px'}}>{selected.avatar}</div>
                <div style={{fontWeight:'700', fontSize:'14px'}}>{selected.name || 'No name'}</div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginTop:'3px'}}>{selected.status}</div>
                <div style={{display:'flex', justifyContent:'center', gap:'6px', marginTop:'8px'}}>
                  <div style={{width:'8px', height:'8px', borderRadius:'50%', background: !selected.score ? '#3d4f63' : selected.score >= 80 ? '#22c55e' : selected.score >= 60 ? '#00e5a0' : selected.score >= 40 ? '#fbbf24' : '#f97316'}}></div>
                  <span style={{fontSize:'10px', color:'#7a8fa6'}}>AI Score: {selected.score || '—'}{selected.score > 0 ? '/100' : ''}</span>
                </div>
              </div>

              {[
                {label:'Phone', value:selected.phone},
                {label:'Email', value:selected.email || '—'},
                {label:'Source', value:`${sourceMeta(selected.channel).icon} ${sourceMeta(selected.channel).label}`},
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