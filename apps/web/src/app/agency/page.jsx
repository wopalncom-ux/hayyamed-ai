'use client'
import { useState, useEffect } from 'react'
import { getAuth, isOwnerRole } from '@/lib/auth'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'
import { useIsMobile } from '@/lib/useIsMobile'

// ── Plan-based profit margins (hidden from clients) ──────────────────────────
// "add X% on top" = X% of client revenue is your profit
const PLAN_MARGINS = {
  'PAYG':       0.35,
  'Starter':    0.30,
  'Growth':     0.25,
  'Enterprise': 0.20,
}
const getMargin  = (plan, customMargin) => customMargin != null ? customMargin / 100 : (PLAN_MARGINS[plan] ?? 0.25)
const profitOf   = (rev, plan, customMargin) => Math.round(rev * getMargin(plan, customMargin))
const costOf     = (rev, plan, customMargin) => rev - profitOf(rev, plan, customMargin)

const initialClients = [
  { id:1, name:'Elite Medical Center',  type:'Healthcare', logo:'🏥', color:'#00e5a0', status:'good',  contacts:1247, messages:3420, balance:1850, monthlyRev:8000,  plan:'Enterprise', wa:'Connected',    lastActive:'2 min ago',  ai:94, notes:'', customMargin:null },
  { id:2, name:'Mazaj Lounge Cafe',     type:'F&B',        logo:'☕', color:'#3b82f6', status:'good',  contacts:892,  messages:2100, balance:620,  monthlyRev:2500,  plan:'Growth',     wa:'Connected',    lastActive:'15 min ago', ai:87, notes:'', customMargin:null },
  { id:3, name:'Doctors In Qatar',      type:'Healthcare', logo:'👨‍⚕️', color:'#a78bfa', status:'warn',  contacts:534,  messages:890,  balance:180,  monthlyRev:2500,  plan:'Growth',     wa:'Warning',      lastActive:'1 hour ago', ai:76, notes:'WhatsApp token expiring', customMargin:null },
  { id:4, name:'LGS Group',             type:'Retail',     logo:'🛍️', color:'#f97316', status:'good',  contacts:2341, messages:5670, balance:3200, monthlyRev:8000,  plan:'Enterprise', wa:'Connected',    lastActive:'5 min ago',  ai:91, notes:'', customMargin:null },
  { id:5, name:'Lifestyle Qatar',       type:'Fashion',    logo:'👗', color:'#ef4444', status:'alert', contacts:234,  messages:120,  balance:0,    monthlyRev:599,   plan:'Starter',    wa:'Disconnected', lastActive:'2 days ago', ai:45, notes:'Balance depleted — needs top-up', customMargin:null },
  { id:6, name:'Magadir Gallery',       type:'Art',        logo:'🎨', color:'#fbbf24', status:'good',  contacts:456,  messages:780,  balance:940,  monthlyRev:2500,  plan:'Growth',     wa:'Connected',    lastActive:'30 min ago', ai:82, notes:'', customMargin:null },
]

const initialPackages = [
  { id:1, name:'Starter', price:299, margin:30, color:'#3b82f6', desc:'Perfect for small businesses getting started', active:true,
    features:['3,000 messages/month','1,000 AI responses','Up to 2,000 contacts','5 team members','Analytics & reports'],
    conditions:['Valid for 1 month','Single WhatsApp number','Max 2 chatbot flows','Email support only'] },
  { id:2, name:'Growth', price:599, margin:25, color:'#00e5a0', desc:'Most popular — ideal for growing businesses', active:true,
    features:['10,000 messages/month','5,000 AI responses','Unlimited contacts','15 team members','Advanced AI chatbot','Priority support'],
    conditions:['Valid for 1 month','Up to 3 WhatsApp numbers','Unlimited chatbot flows','Phone & email support'] },
  { id:3, name:'Enterprise', price:1299, margin:20, color:'#a78bfa', desc:'Full power for large operations', active:true,
    features:['Unlimited messages','Unlimited AI responses','Unlimited contacts','Unlimited team members','Dedicated account manager','White label option'],
    conditions:['Annual contract available','Unlimited channels','Custom integrations','24/7 dedicated support'] },
]

const statusColors  = { good:'#00e5a0', warn:'#fbbf24', alert:'#ef4444' }
const statusLabels  = { good:'Active', warn:'Warning', alert:'Needs Attention' }
const logos         = ['🏢','🏥','☕','🛍️','👗','🎨','🏪','🏬','🍕','💊','🏦','🏨','🚗','🎓','⚽']

const btn = (extra={}) => ({
  padding:'8px 18px', border:'none', borderRadius:'6px', fontWeight:'700', fontSize:'12px',
  cursor:'pointer', letterSpacing:'.3px', transition:'all .15s',
  ...extra,
})
const inp = {
  width:'100%', background:'#111622', border:'1px solid #1e2d42', borderRadius:'6px',
  padding:'10px 14px', color:'#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box',
}
const lbl = { fontSize:'10px', color:'#7a8fa6', marginBottom:'6px', display:'block', letterSpacing:'1px' }
const card = { background:'#0f1520', border:'1px solid #1e2d42', borderRadius:'8px', padding:'20px' }

export default function Agency() {
  const isMobile = useIsMobile()
  const [clients,    setClients]    = useState([])
  const [packages,   setPackages]   = useState([])
  const [selected,   setSelected]   = useState(null)
  const [search,     setSearch]     = useState('')
  const [showAdd,    setShowAdd]    = useState(false)
  const [showTopUp,  setShowTopUp]  = useState(false)
  const [topUpAmt,   setTopUpAmt]   = useState('500')
  const [topUpNote,  setTopUpNote]  = useState('')
  const [activeTab,  setActiveTab]  = useState('clients')
  const [newClient,  setNewClient]  = useState({ name:'', type:'', plan:'Growth', logo:'🏢' })
  const [saved,      setSaved]      = useState('')
  const [authorized,    setAuthorized]    = useState(true)
  const [editingMargin, setEditingMargin] = useState(false)
  const [marginInput,   setMarginInput]   = useState('')
  const [showPkgBuilder,setShowPkgBuilder]= useState(false)
  const [editPkg,       setEditPkg]       = useState(null)
  const [pkgForm, setPkgForm] = useState({
    name:'', price:'', margin:'25', color:'#00e5a0', desc:'', active:true,
    features:[''], conditions:[''],
  })
  const [showClientSettings, setShowClientSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState({})

  useEffect(() => {
    const { role } = getAuth()
    if (role && !isOwnerRole(role)) setAuthorized(false)
    Promise.all([
      api.getAgencyClients().catch(() => []),
      api.getAgencyPackages().catch(() => []),
    ]).then(([cls, pkgs]) => {
      setClients(Array.isArray(cls) ? cls : [])
      setPackages(Array.isArray(pkgs) ? pkgs.map(p => ({ ...p, features: p.features || [], conditions: p.conditions || [] })) : [])
    })
  }, [])

  if (!authorized) return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'16px', fontFamily:'sans-serif'}}>
      <div style={{fontSize:'48px'}}>🔒</div>
      <div style={{fontSize:'20px', fontWeight:'800'}}>Owner Access Only</div>
      <div style={{fontSize:'13px', color:'#7a8fa6', textAlign:'center', maxWidth:'320px', lineHeight:'1.6'}}>The Master Control Panel is restricted to the account owner. Please log in with owner credentials to access this page.</div>
      <a href="/login" style={{marginTop:'8px', padding:'10px 24px', background:'#00e5a0', color:'#07090f', borderRadius:'6px', fontWeight:'700', fontSize:'13px', textDecoration:'none'}}>Go to Login</a>
      <a href="/dashboard" style={{fontSize:'12px', color:'#3d4f63', textDecoration:'none'}}>Back to Dashboard</a>
    </div>
  )

  const saveMsg = (m) => { setSaved(m); setTimeout(() => setSaved(''), 2500) }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.type.toLowerCase().includes(search.toLowerCase())
  )

  // ── KPI aggregates ──────────────────────────────────────────────────────────
  const totalRev    = clients.reduce((s,c) => s + c.monthlyRev, 0)
  const totalProfit = clients.reduce((s,c) => s + profitOf(c.monthlyRev, c.plan, c.customMargin), 0)
  const totalCost   = totalRev - totalProfit
  const totalMsgs   = clients.reduce((s,c) => s + c.messages, 0)
  const totalConts  = clients.reduce((s,c) => s + c.contacts, 0)

  // ── Top-up ──────────────────────────────────────────────────────────────────
  const applyTopUp = async () => {
    if (!selected || !topUpAmt) return
    const amt = parseInt(topUpAmt) || 0
    try { await api.topUpAgencyClient(selected.id, amt) } catch {}
    setClients(prev => prev.map(c =>
      c.id === selected.id ? { ...c, balance: (c.balance||0) + amt, status: amt > 0 ? 'good' : c.status } : c
    ))
    setSelected(prev => ({ ...prev, balance: (prev.balance||0) + amt }))
    setShowTopUp(false); setTopUpAmt('500'); setTopUpNote('')
    saveMsg(`QAR ${amt} added to ${selected.name}`)
  }

  // ── Margin override ─────────────────────────────────────────────────────────
  const saveMarginOverride = async () => {
    const val = marginInput === '' ? null : Math.min(99, Math.max(0, parseInt(marginInput) || 0))
    try { await api.updateAgencyClient(selected.id, { customMargin: val }) } catch {}
    setClients(prev => prev.map(c => c.id === selected.id ? { ...c, customMargin: val } : c))
    setSelected(prev => ({ ...prev, customMargin: val }))
    setEditingMargin(false)
    saveMsg(val == null ? 'Margin reset to plan default' : `Margin set to ${val}% for ${selected.name}`)
  }

  // ── Add client ──────────────────────────────────────────────────────────────
  const planRevMap = { 'PAYG':150, 'Starter':299, 'Growth':599, 'Enterprise':1299 }
  const addClient = async () => {
    if (!newClient.name || !newClient.type) return
    try {
      const created = await api.createAgencyClient({
        name: newClient.name, type: newClient.type, logo: newClient.logo, plan: newClient.plan,
        monthlyRev: planRevMap[newClient.plan] || 299,
      })
      setClients(prev => [...prev, {
        id: created.id, name: newClient.name, type: newClient.type, logo: newClient.logo,
        status:'good', contacts:0, messages:0, balance:0,
        monthlyRev: planRevMap[newClient.plan] || 299, plan: newClient.plan,
        wa:'Disconnected', lastActive:'Just now', ai:0, notes:'', customMargin:null,
      }])
    } catch {
      setClients(prev => [...prev, {
        id: Date.now(), name: newClient.name, type: newClient.type, logo: newClient.logo,
        status:'good', contacts:0, messages:0, balance:0,
        monthlyRev: planRevMap[newClient.plan] || 299, plan: newClient.plan,
        wa:'Disconnected', lastActive:'Just now', ai:0, notes:'', customMargin:null,
      }])
    }
    setShowAdd(false); setNewClient({ name:'', type:'', plan:'Growth', logo:'🏢' })
    saveMsg('Client added!')
  }

  // ── Package builder ─────────────────────────────────────────────────────────
  const openNewPkg = () => {
    setPkgForm({ name:'', price:'', margin:'25', color:'#00e5a0', desc:'', active:true, features:[''], conditions:[''] })
    setEditPkg(null); setShowPkgBuilder(true)
  }
  const openEditPkg = (pkg) => {
    setPkgForm({ ...pkg, price:String(pkg.price), margin:String(pkg.margin),
      features:[...pkg.features,''], conditions:[...pkg.conditions,''] })
    setEditPkg(pkg.id); setShowPkgBuilder(true)
  }
  const savePkg = async () => {
    if (!pkgForm.name || !pkgForm.price) return
    const cleaned = {
      ...pkgForm, price: parseInt(pkgForm.price)||0, margin: parseInt(pkgForm.margin)||0,
      features:   pkgForm.features.filter(f=>f.trim()),
      conditions: pkgForm.conditions.filter(c=>c.trim()),
    }
    if (editPkg) {
      try { await api.updateAgencyPackage(editPkg, cleaned) } catch {}
      setPackages(prev => prev.map(p => p.id === editPkg ? { ...cleaned, id: editPkg } : p))
      saveMsg(`Package "${cleaned.name}" updated!`)
    } else {
      try {
        const created = await api.createAgencyPackage(cleaned)
        setPackages(prev => [...prev, { ...cleaned, id: created.id }])
      } catch {
        setPackages(prev => [...prev, { ...cleaned, id: Date.now() }])
      }
      saveMsg(`Package "${cleaned.name}" created!`)
    }
    setShowPkgBuilder(false)
  }
  const deletePkg = async (id) => {
    try { await api.deleteAgencyPackage(id) } catch {}
    setPackages(prev => prev.filter(p => p.id !== id))
    saveMsg('Package deleted')
  }
  const togglePkg = async (id) => {
    const pkg = packages.find(p => p.id === id)
    if (!pkg) return
    try { await api.updateAgencyPackage(id, { isActive: !pkg.isActive }) } catch {}
    setPackages(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive, active: !p.active } : p))
  }

  const openClientSettings = () => {
    setSettingsForm({ name: selected.name, type: selected.type, plan: selected.plan, status: selected.status, wa: selected.wa, notes: selected.notes, logo: selected.logo })
    setShowClientSettings(true)
  }
  const saveClientSettings = async () => {
    try { await api.updateAgencyClient(selected.id, { name: settingsForm.name, type: settingsForm.type, notes: settingsForm.notes, status: settingsForm.status, logo: settingsForm.logo }) } catch {}
    setClients(prev => prev.map(c => c.id === selected.id ? { ...c, ...settingsForm } : c))
    setSelected(prev => ({ ...prev, ...settingsForm }))
    setShowClientSettings(false)
    saveMsg(`${settingsForm.name} settings saved`)
  }

  const updatePkgList = (field, idx, val) => {
    setPkgForm(prev => {
      const arr = [...prev[field]]
      arr[idx] = val
      if (idx === arr.length - 1 && val.trim()) arr.push('')
      return { ...prev, [field]: arr }
    })
  }
  const removePkgListItem = (field, idx) => {
    setPkgForm(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== idx) }))
  }

  const marginColors = ['#ef4444','#f97316','#fbbf24','#00e5a0','#3b82f6','#a78bfa','#06b6d4','#ec4899']

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'Inter, sans-serif'}}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1e2d42', display:'flex', alignItems:'center', padding:'0 20px', gap:'14px', flexShrink:0}}>
        <div style={{fontWeight:'900', fontSize:'16px', letterSpacing:'-0.5px'}}>Hayya<span style={{color:'#00e5a0'}}> AI</span></div>
        <div style={{fontSize:'11px', color:'#3d4f63'}}>/ Master Control</div>
        <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:'10px'}}>
          {saved && <span style={{fontSize:'11px', color:'#00e5a0', fontWeight:'600'}}>✓ {saved}</span>}
          <a href="/integrations" style={{padding:'6px 12px', background:'rgba(59,130,246,.12)', border:'1px solid rgba(59,130,246,.3)', borderRadius:'6px', color:'#60a5fa', fontSize:'11px', fontWeight:'700', textDecoration:'none', cursor:'pointer'}}>🔌 Integrations</a>
          <div style={{fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.25)', color:'#00e5a0', borderRadius:'4px', fontWeight:'700'}}>● LIVE</div>
          <div style={{width:'32px', height:'32px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'800'}}>A</div>
        </div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>

        <NavSidebar current="agency" />

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>

          {/* ── KPI strip ─────────────────────────────────────────────────── */}
          <div style={{padding:'0 20px', background:'#0c0f1a', borderBottom:'1px solid #1e2d42', display:'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(6,1fr)', flexShrink:0}}>
            {[
              { label:'TOTAL CLIENTS',  value: clients.length,                         color:'#e2e8f0' },
              { label:'MONTHLY REVENUE',value:`QAR ${totalRev.toLocaleString()}`,       color:'#00e5a0' },
              { label:'YOUR PROFIT',    value:`QAR ${totalProfit.toLocaleString()}`,    color:'#a78bfa', tip:'Variable by plan' },
              { label:'PLATFORM COST',  value:`QAR ${totalCost.toLocaleString()}`,      color:'#f97316' },
              { label:'TOTAL MESSAGES', value: totalMsgs.toLocaleString(),              color:'#3b82f6' },
              { label:'TOTAL CONTACTS', value: totalConts.toLocaleString(),             color:'#e2e8f0' },
            ].map((k,i) => (
              <div key={i} style={{textAlign:'center', padding:'12px 8px'}}>
                <div style={{fontSize:'8px', color:'#3d4f63', letterSpacing:'1.5px', marginBottom:'5px'}}>{k.label}</div>
                <div style={{fontSize:'15px', fontWeight:'900', color:k.color}}>{k.value}</div>
                {k.tip && <div style={{fontSize:'8px', color:'#3d4f63', marginTop:'2px'}}>{k.tip}</div>}
              </div>
            ))}
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div style={{padding:'0 20px', borderBottom:'1px solid #1e2d42', display:'flex', background:'#0c0f1a', flexShrink:0}}>
            {[
              { id:'clients',  label:'Client Accounts' },
              { id:'profit',   label:'Profit & Revenue' },
              { id:'balances', label:'Balance Management' },
              { id:'packages', label:'Package Builder' },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{padding:'12px 18px', background:'none', border:'none', borderBottom: activeTab===t.id ? '2px solid #00e5a0' : '2px solid transparent', color: activeTab===t.id ? '#e2e8f0' : '#7a8fa6', fontSize:'12px', fontWeight: activeTab===t.id ? '700' : '400', cursor:'pointer'}}>
                {t.label}
              </button>
            ))}
            <div style={{marginLeft:'auto', display:'flex', gap:'8px', alignItems:'center', paddingRight:'4px'}}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…"
                style={{width:'190px', background:'#111622', border:'1px solid #1e2d42', borderRadius:'6px', padding:'7px 12px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}/>
              <button onClick={() => setShowAdd(true)} style={btn({background:'#00e5a0', color:'#07090f', padding:'7px 14px'})}>+ Add Client</button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              TAB: CLIENT ACCOUNTS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'clients' && (
            <div style={{flex:1, display:'flex', overflow:'hidden'}}>
              <div style={{flex:1, overflowY:'auto', padding:'18px', display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:'14px', alignContent:'start'}}>
                {filtered.map(c => {
                  const profit = profitOf(c.monthlyRev, c.plan, c.customMargin)
                  const margin = Math.round((profit / c.monthlyRev) * 100)
                  const marginColor = margin >= 30 ? '#00e5a0' : margin >= 25 ? '#fbbf24' : '#f97316'
                  return (
                    <div key={c.id} onClick={() => setSelected(c)}
                      style={{...card, borderColor: selected?.id===c.id ? c.color+'80' : '#1e2d42', borderLeft:`3px solid ${statusColors[c.status]}`, cursor:'pointer', transition:'all .2s'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px'}}>
                        <div style={{width:'40px', height:'40px', borderRadius:'8px', background:c.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0}}>{c.logo}</div>
                        <div style={{flex:1, minWidth:0}}>
                          <div style={{fontWeight:'800', fontSize:'13px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{c.name}</div>
                          <div style={{fontSize:'10px', color:'#7a8fa6', marginTop:'2px'}}>{c.type}</div>
                        </div>
                        <div style={{textAlign:'right', flexShrink:0}}>
                          <div style={{fontSize:'10px', fontWeight:'800', color:marginColor}}>{margin}% margin</div>
                          <div style={{fontSize:'9px', color:'#3d4f63', marginTop:'1px'}}>{c.plan}{c.customMargin != null ? ' (custom)' : ''}</div>
                        </div>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px', marginBottom:'12px'}}>
                        {[
                          { label:'REVENUE',  value:`QAR ${c.monthlyRev.toLocaleString()}`, color:c.color },
                          { label:'PROFIT',   value:`QAR ${profit.toLocaleString()}`,        color:'#a78bfa' },
                          { label:'BALANCE',  value:`QAR ${c.balance.toLocaleString()}`,     color: c.balance>0 ? '#00e5a0' : '#ef4444' },
                          { label:'AI SCORE', value:`${c.ai}%`,                              color:'#e2e8f0' },
                        ].map(s => (
                          <div key={s.label} style={{textAlign:'center', background:'#0c0f1a', borderRadius:'5px', padding:'7px 4px'}}>
                            <div style={{fontSize:'12px', fontWeight:'900', color:s.color}}>{s.value}</div>
                            <div style={{fontSize:'8px', color:'#3d4f63', letterSpacing:'1px', marginTop:'2px'}}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                        <div style={{fontSize:'10px', color:'#7a8fa6', display:'flex', alignItems:'center', gap:'5px'}}>
                          <div style={{width:'6px', height:'6px', borderRadius:'50%', background: c.wa==='Connected' ? '#00e5a0' : c.wa==='Warning' ? '#fbbf24' : '#ef4444'}}></div>
                          {c.wa}
                        </div>
                        <div style={{display:'flex', gap:'6px'}}>
                          <button onClick={e => { e.stopPropagation(); setSelected(c); setShowTopUp(true) }}
                            style={btn({background:'rgba(0,229,160,.1)', color:'#00e5a0', padding:'5px 10px', fontSize:'11px', border:'1px solid rgba(0,229,160,.2)', borderRadius:'5px'})}>
                            + Balance
                          </button>
                          <button onClick={e => { e.stopPropagation(); setSelected(c) }}
                            style={btn({background:'#1a2235', color:'#e2e8f0', padding:'5px 10px', fontSize:'11px', border:'1px solid #1e2d42', borderRadius:'5px'})}>
                            Manage
                          </button>
                        </div>
                      </div>
                      {c.notes && <div style={{marginTop:'10px', padding:'7px 10px', background:'rgba(251,191,36,.07)', border:'1px solid rgba(251,191,36,.2)', borderRadius:'5px', fontSize:'10px', color:'#fbbf24'}}>⚠️ {c.notes}</div>}
                    </div>
                  )
                })}
              </div>

              {/* ── Client detail panel ──────────────────────────────────────── */}
              {selected && (
                <div style={{width: isMobile ? '100%' : '300px', borderLeft:'1px solid #1e2d42', background:'#0c0f1a', padding:'22px', overflowY:'auto', flexShrink:0}}>
                  <div style={{textAlign:'center', marginBottom:'20px'}}>
                    <div style={{width:'56px', height:'56px', borderRadius:'12px', background:selected.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', margin:'0 auto 10px'}}>{selected.logo}</div>
                    <div style={{fontWeight:'800', fontSize:'15px'}}>{selected.name}</div>
                    <div style={{fontSize:'11px', color:'#7a8fa6', marginTop:'3px'}}>{selected.type} · {selected.plan}</div>
                  </div>

                  {/* Balance box */}
                  <div style={{background: selected.balance > 200 ? 'rgba(0,229,160,.06)' : 'rgba(239,68,68,.06)', border:`1px solid ${selected.balance>200 ? 'rgba(0,229,160,.25)' : 'rgba(239,68,68,.25)'}`, borderRadius:'8px', padding:'14px', marginBottom:'14px', textAlign:'center'}}>
                    <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1.5px', marginBottom:'5px'}}>ACCOUNT BALANCE</div>
                    <div style={{fontSize:'22px', fontWeight:'900', color: selected.balance>200 ? '#00e5a0' : '#ef4444'}}>QAR {selected.balance.toLocaleString()}</div>
                    {selected.balance < 200 && <div style={{fontSize:'10px', color:'#ef4444', marginTop:'3px'}}>⚠️ Low balance</div>}
                    <button onClick={() => setShowTopUp(true)}
                      style={{background:'#00e5a0', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer', width:'100%', marginTop:'8px', padding:'8px'}}
                      >+ Add Balance</button>
                  </div>

                  {/* ── Margin override ── */}
                  <div style={{...card, marginBottom:'14px', padding:'14px'}}>
                    <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1.5px', marginBottom:'10px'}}>PROFIT MARGIN CONTROL</div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                      <div>
                        <div style={{fontSize:'12px', color:'#7a8fa6'}}>Plan default</div>
                        <div style={{fontSize:'15px', fontWeight:'900', color:'#a78bfa'}}>{Math.round((PLAN_MARGINS[selected.plan]??0.25)*100)}%</div>
                      </div>
                      {selected.customMargin != null && (
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:'12px', color:'#7a8fa6'}}>Custom override</div>
                          <div style={{fontSize:'15px', fontWeight:'900', color:'#f97316'}}>{selected.customMargin}%</div>
                        </div>
                      )}
                    </div>
                    {editingMargin ? (
                      <div style={{display:'flex', gap:'6px', alignItems:'center'}}>
                        <input value={marginInput} onChange={e => setMarginInput(e.target.value.replace(/\D/g,''))}
                          placeholder="e.g. 28" maxLength={2}
                          style={{...inp, padding:'7px 10px', fontSize:'13px', width:'70px', textAlign:'center'}}/>
                        <span style={{fontSize:'12px', color:'#7a8fa6'}}>%</span>
                        <button onClick={saveMarginOverride} style={btn({background:'#00e5a0', color:'#07090f', padding:'7px 12px', fontSize:'11px', flex:1})}>Save</button>
                        <button onClick={() => setEditingMargin(false)} style={btn({background:'#111622', color:'#7a8fa6', padding:'7px 10px', fontSize:'11px', border:'1px solid #1e2d42'})}>✕</button>
                      </div>
                    ) : (
                      <div style={{display:'flex', gap:'6px'}}>
                        <button onClick={() => { setEditingMargin(true); setMarginInput(String(selected.customMargin ?? Math.round((PLAN_MARGINS[selected.plan]??0.25)*100))) }}
                          style={btn({background:'rgba(167,139,250,.1)', color:'#a78bfa', padding:'7px 12px', fontSize:'11px', border:'1px solid rgba(167,139,250,.25)', flex:1})}>
                          Set Custom %
                        </button>
                        {selected.customMargin != null && (
                          <button onClick={() => { setMarginInput(''); saveMarginOverride(); }}
                            style={btn({background:'rgba(239,68,68,.1)', color:'#ef4444', padding:'7px 10px', fontSize:'11px', border:'1px solid rgba(239,68,68,.25)'})}>
                            Reset
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Profit breakdown */}
                  <div style={{background:'rgba(167,139,250,.05)', border:'1px solid rgba(167,139,250,.15)', borderRadius:'8px', padding:'14px', marginBottom:'14px'}}>
                    <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1.5px', marginBottom:'10px'}}>REVENUE BREAKDOWN</div>
                    {(() => {
                      const rev    = selected.monthlyRev
                      const profit = profitOf(rev, selected.plan, selected.customMargin)
                      const cost   = costOf(rev, selected.plan, selected.customMargin)
                      const margin = Math.round((profit/rev)*100)
                      return [
                        { label:'Client Revenue',   value:`QAR ${rev.toLocaleString()}`,    color:'#00e5a0' },
                        { label:'Platform Cost',    value:`QAR ${cost.toLocaleString()}`,   color:'#f97316' },
                        { label:'Your Net Profit',  value:`QAR ${profit.toLocaleString()}`, color:'#a78bfa' },
                        { label:'Margin',           value:`${margin}%`,                     color:'#a78bfa' },
                      ].map(r => (
                        <div key={r.label} style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', paddingBottom:'8px', borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                          <div style={{fontSize:'11px', color:'#7a8fa6'}}>{r.label}</div>
                          <div style={{fontSize:'12px', fontWeight:'800', color:r.color}}>{r.value}</div>
                        </div>
                      ))
                    })()}
                  </div>

                  <div style={{display:'flex', flexDirection:'column', gap:'7px'}}>
                    <button onClick={() => window.location.href = '/inbox'} style={btn({background:'linear-gradient(135deg,#00e5a0,#00c98a)', color:'#07090f', width:'100%', padding:'9px'})}>💬 Open Inbox</button>
                    <button onClick={() => window.location.href = '/reports'} style={btn({background:'#111622', color:'#e2e8f0', width:'100%', padding:'9px', border:'1px solid #1e2d42'})}>📊 View Reports</button>
                    <button onClick={openClientSettings} style={btn({background:'#111622', color:'#e2e8f0', width:'100%', padding:'9px', border:'1px solid #1e2d42'})}>⚙️ Client Settings</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB: PROFIT & REVENUE
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'profit' && (
            <div style={{flex:1, overflowY:'auto', padding:'24px'}}>
              {/* Margin legend */}
              <div style={{display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'12px', marginBottom:'20px'}}>
                {[
                  { plan:'PAYG',       margin:35, color:'#ef4444', desc:'Pay as you go' },
                  { plan:'Starter',    margin:30, color:'#fbbf24', desc:'QAR 299/month' },
                  { plan:'Growth',     margin:25, color:'#00e5a0', desc:'QAR 599/month' },
                  { plan:'Enterprise', margin:20, color:'#a78bfa', desc:'QAR 1,299/month' },
                ].map(p => (
                  <div key={p.plan} style={{...card, borderTop:`2px solid ${p.color}`, textAlign:'center', padding:'16px'}}>
                    <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1.5px', marginBottom:'8px'}}>{p.plan.toUpperCase()}</div>
                    <div style={{fontSize:'28px', fontWeight:'900', color:p.color}}>{p.margin}%</div>
                    <div style={{fontSize:'10px', color:'#7a8fa6', marginTop:'4px'}}>your margin</div>
                    <div style={{fontSize:'10px', color:'#3d4f63', marginTop:'3px'}}>{p.desc}</div>
                  </div>
                ))}
              </div>

              {/* Summary KPIs */}
              <div style={{display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:'12px', marginBottom:'20px'}}>
                {[
                  { label:'Total Monthly Revenue', value:`QAR ${totalRev.toLocaleString()}`,    sub:'All clients combined',     color:'#00e5a0', icon:'💰' },
                  { label:'Your Net Profit',        value:`QAR ${totalProfit.toLocaleString()}`, sub:`${Math.round(totalProfit/totalRev*100)}% blended margin`, color:'#a78bfa', icon:'📈' },
                  { label:'Platform & API Costs',   value:`QAR ${totalCost.toLocaleString()}`,   sub:'What you pay providers',   color:'#f97316', icon:'⚙️' },
                ].map(k => (
                  <div key={k.label} style={{...card, borderTop:`2px solid ${k.color}`}}>
                    <div style={{fontSize:'20px', marginBottom:'8px'}}>{k.icon}</div>
                    <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1.5px', marginBottom:'6px'}}>{k.label.toUpperCase()}</div>
                    <div style={{fontSize:'26px', fontWeight:'900', color:k.color}}>{k.value}</div>
                    <div style={{fontSize:'11px', color:'#7a8fa6', marginTop:'4px'}}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Per-client table */}
              <div style={{...card}}>
                <div style={{fontWeight:'800', fontSize:'14px', marginBottom:'4px'}}>Per-Client Breakdown</div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'18px'}}>Private — only visible in Master Control</div>
                <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr', gap:'1px', background:'#1e2d42', borderRadius:'6px', overflow:'hidden'}}>
                  {['CLIENT','PLAN','MARGIN','MONTHLY REV.','PLATFORM COST','YOUR PROFIT'].map(h => (
                    <div key={h} style={{background:'#0c0f1a', padding:'10px 12px', fontSize:'9px', color:'#3d4f63', letterSpacing:'1.2px', fontWeight:'700', textAlign: h==='CLIENT' ? 'left' : 'right'}}>{h}</div>
                  ))}
                  {clients.map(c => {
                    const profit = profitOf(c.monthlyRev, c.plan, c.customMargin)
                    const cost   = costOf(c.monthlyRev, c.plan, c.customMargin)
                    const margin = Math.round((profit/c.monthlyRev)*100)
                    const marginColor = margin >= 30 ? '#00e5a0' : margin >= 25 ? '#fbbf24' : '#f97316'
                    return [
                      <div key={c.id+'n'} style={{background:'#0f1520', padding:'12px', display:'flex', alignItems:'center', gap:'8px'}}>
                        <span style={{fontSize:'16px'}}>{c.logo}</span>
                        <div>
                          <div style={{fontSize:'12px', fontWeight:'700'}}>{c.name}</div>
                          <div style={{fontSize:'9px', color:'#3d4f63'}}>{c.type}</div>
                        </div>
                      </div>,
                      <div key={c.id+'pl'} style={{background:'#0f1520', padding:'12px', textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end'}}>
                        <span style={{fontSize:'10px', padding:'3px 7px', borderRadius:'3px', background:'#1a2235', color:'#7a8fa6'}}>{c.plan}{c.customMargin!=null?' *':''}</span>
                      </div>,
                      <div key={c.id+'m'} style={{background:'#0f1520', padding:'12px', textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end'}}>
                        <span style={{fontSize:'13px', fontWeight:'900', color:marginColor}}>{margin}%</span>
                      </div>,
                      <div key={c.id+'r'} style={{background:'#0f1520', padding:'12px', textAlign:'right', fontSize:'12px', color:'#00e5a0', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'flex-end'}}>QAR {c.monthlyRev.toLocaleString()}</div>,
                      <div key={c.id+'c'} style={{background:'#0f1520', padding:'12px', textAlign:'right', fontSize:'12px', color:'#f97316', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'flex-end'}}>QAR {cost.toLocaleString()}</div>,
                      <div key={c.id+'p'} style={{background:'#0f1520', padding:'12px', textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'6px'}}>
                        <span style={{fontSize:'12px', color:'#a78bfa', fontWeight:'900'}}>QAR {profit.toLocaleString()}</span>
                      </div>,
                    ]
                  })}
                </div>
                <div style={{fontSize:'10px', color:'#3d4f63', marginTop:'10px'}}>* = custom margin override applied</div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB: BALANCE MANAGEMENT
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'balances' && (
            <div style={{flex:1, overflowY:'auto', padding:'24px'}}>
              <div style={{marginBottom:'20px'}}>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'4px'}}>Balance Management</div>
                <div style={{fontSize:'12px', color:'#7a8fa6'}}>Top up clients who pay by cash, bank transfer, or cheque</div>
              </div>
              <div style={{...card, marginBottom:'14px'}}>
                <div style={{display:'grid', gridTemplateColumns:'2.5fr 1fr 1fr 1fr 1.5fr', gap:'1px', background:'#1e2d42', borderRadius:'6px', overflow:'hidden'}}>
                  {['CLIENT','PLAN','BALANCE','STATUS','ACTION'].map(h => (
                    <div key={h} style={{background:'#0c0f1a', padding:'10px 14px', fontSize:'9px', color:'#3d4f63', letterSpacing:'1.5px', fontWeight:'700', textAlign:'center'}}>{h}</div>
                  ))}
                  {clients.map(c => [
                    <div key={c.id+'n'} style={{background:'#0f1520', padding:'14px', display:'flex', alignItems:'center', gap:'10px'}}>
                      <span style={{fontSize:'18px'}}>{c.logo}</span>
                      <div><div style={{fontSize:'12px', fontWeight:'700'}}>{c.name}</div><div style={{fontSize:'10px', color:'#7a8fa6'}}>{c.type}</div></div>
                    </div>,
                    <div key={c.id+'pl'} style={{background:'#0f1520', padding:'14px', textAlign:'center', fontSize:'11px', color:'#7a8fa6', display:'flex', alignItems:'center', justifyContent:'center'}}>{c.plan}</div>,
                    <div key={c.id+'b'} style={{background:'#0f1520', padding:'14px', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <span style={{fontSize:'13px', fontWeight:'900', color: c.balance>500?'#00e5a0':c.balance>0?'#fbbf24':'#ef4444'}}>QAR {c.balance.toLocaleString()}</span>
                    </div>,
                    <div key={c.id+'s'} style={{background:'#0f1520', padding:'14px', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <span style={{fontSize:'10px', padding:'3px 8px', borderRadius:'4px', background:statusColors[c.status]+'18', color:statusColors[c.status], fontWeight:'700'}}>{statusLabels[c.status]}</span>
                    </div>,
                    <div key={c.id+'a'} style={{background:'#0f1520', padding:'14px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <button onClick={() => { setSelected(c); setShowTopUp(true) }}
                        style={btn({background:'linear-gradient(135deg,#00e5a0,#00c98a)', color:'#07090f', padding:'6px 14px', fontSize:'11px', borderRadius:'5px'})}>
                        + Add Balance
                      </button>
                    </div>,
                  ])}
                </div>
              </div>
              <div style={{...card, background:'rgba(251,191,36,.04)', borderColor:'rgba(251,191,36,.2)'}}>
                <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'12px', color:'#fbbf24'}}>Accepted Payment Methods</div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px'}}>
                  {[
                    { icon:'🏦', label:'Bank Transfer',  desc:'IBAN — credits within 24h' },
                    { icon:'💵', label:'Cash Payment',   desc:'In-person — instant credit' },
                    { icon:'📄', label:'Cheque',         desc:'Business cheque — 3 days' },
                    { icon:'💳', label:'Card / Stripe',  desc:'Online via client portal' },
                  ].map(m => (
                    <div key={m.label} style={{background:'#0f1520', border:'1px solid #1e2d42', borderRadius:'6px', padding:'14px', textAlign:'center'}}>
                      <div style={{fontSize:'22px', marginBottom:'6px'}}>{m.icon}</div>
                      <div style={{fontSize:'12px', fontWeight:'700', marginBottom:'4px'}}>{m.label}</div>
                      <div style={{fontSize:'10px', color:'#7a8fa6'}}>{m.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB: PACKAGE BUILDER
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'packages' && (
            <div style={{flex:1, overflowY:'auto', padding:'24px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px'}}>
                <div>
                  <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'4px'}}>Package Builder</div>
                  <div style={{fontSize:'12px', color:'#7a8fa6'}}>Create and manage custom subscription packages with built-in profit margins</div>
                </div>
                <button onClick={openNewPkg} style={btn({background:'linear-gradient(135deg,#00e5a0,#00c98a)', color:'#07090f', padding:'9px 18px'})}>
                  + Create Package
                </button>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px'}}>
                {packages.map(pkg => (
                  <div key={pkg.id} style={{...card, borderTop:`3px solid ${pkg.color}`, opacity: pkg.active ? 1 : 0.55}}>
                    <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px'}}>
                      <div>
                        <div style={{fontWeight:'900', fontSize:'16px', color:pkg.color}}>{pkg.name}</div>
                        <div style={{fontSize:'11px', color:'#7a8fa6', marginTop:'2px'}}>{pkg.desc}</div>
                      </div>
                      <div style={{display:'flex', gap:'6px', alignItems:'center'}}>
                        <button onClick={() => togglePkg(pkg.id)}
                          style={{width:'36px', height:'20px', borderRadius:'10px', border:'none', cursor:'pointer', background: pkg.active ? '#00e5a0' : '#1a2235', position:'relative', transition:'background .2s'}}>
                          <span style={{position:'absolute', top:'3px', left: pkg.active ? '18px' : '3px', width:'14px', height:'14px', borderRadius:'50%', background:'#fff', transition:'left .2s', display:'block'}}></span>
                        </button>
                      </div>
                    </div>

                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'14px'}}>
                      <div style={{background:'#0c0f1a', borderRadius:'6px', padding:'10px', textAlign:'center'}}>
                        <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px', marginBottom:'4px'}}>CLIENT PRICE</div>
                        <div style={{fontSize:'18px', fontWeight:'900', color:'#00e5a0'}}>QAR {pkg.price}</div>
                        <div style={{fontSize:'9px', color:'#3d4f63'}}>per month</div>
                      </div>
                      <div style={{background:'#0c0f1a', borderRadius:'6px', padding:'10px', textAlign:'center'}}>
                        <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px', marginBottom:'4px'}}>YOUR MARGIN</div>
                        <div style={{fontSize:'18px', fontWeight:'900', color:'#a78bfa'}}>{pkg.margin}%</div>
                        <div style={{fontSize:'9px', color:'#a78bfa'}}>QAR {Math.round(pkg.price*pkg.margin/100)}/mo profit</div>
                      </div>
                    </div>

                    <div style={{marginBottom:'12px'}}>
                      <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px', marginBottom:'8px'}}>FEATURES</div>
                      {pkg.features.map((f,i) => (
                        <div key={i} style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'4px', display:'flex', alignItems:'center', gap:'6px'}}>
                          <span style={{color:pkg.color}}>✓</span> {f}
                        </div>
                      ))}
                    </div>

                    {pkg.conditions.length > 0 && (
                      <div style={{marginBottom:'14px', padding:'10px', background:'rgba(251,191,36,.05)', border:'1px solid rgba(251,191,36,.15)', borderRadius:'5px'}}>
                        <div style={{fontSize:'9px', color:'#fbbf24', letterSpacing:'1px', marginBottom:'6px'}}>CONDITIONS</div>
                        {pkg.conditions.map((c,i) => (
                          <div key={i} style={{fontSize:'10px', color:'#7a8fa6', marginBottom:'3px', display:'flex', alignItems:'center', gap:'5px'}}>
                            <span style={{color:'#fbbf24'}}>•</span> {c}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{display:'flex', gap:'8px'}}>
                      <button onClick={() => openEditPkg(pkg)} style={btn({background:'rgba(167,139,250,.1)', color:'#a78bfa', padding:'6px 14px', fontSize:'11px', border:'1px solid rgba(167,139,250,.2)', flex:1})}>Edit</button>
                      <button onClick={() => deletePkg(pkg.id)} style={btn({background:'rgba(239,68,68,.1)', color:'#ef4444', padding:'6px 12px', fontSize:'11px', border:'1px solid rgba(239,68,68,.2)'})}>Delete</button>
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {packages.length === 0 && (
                  <div style={{gridColumn:'1/-1', textAlign:'center', padding:'60px 20px', color:'#3d4f63'}}>
                    <div style={{fontSize:'40px', marginBottom:'12px'}}>📦</div>
                    <div style={{fontSize:'14px', marginBottom:'6px'}}>No packages yet</div>
                    <div style={{fontSize:'12px'}}>Create your first package to start offering plans to clients</div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Add Balance
      ══════════════════════════════════════════════════════════════════════ */}
      {showTopUp && selected && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'#0f1520', border:'1px solid #1e2d42', padding:'32px', borderRadius:'12px', width:'440px', boxShadow:'0 24px 80px rgba(0,0,0,.6)'}}>
            <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px'}}>
              <div style={{width:'44px', height:'44px', borderRadius:'10px', background:selected.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px'}}>{selected.logo}</div>
              <div>
                <div style={{fontWeight:'800', fontSize:'16px'}}>Add Balance</div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginTop:'2px'}}>{selected.name} · Current: QAR {selected.balance.toLocaleString()}</div>
              </div>
            </div>
            <div style={{marginBottom:'16px'}}>
              <label style={lbl}>SELECT AMOUNT</label>
              <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'10px'}}>
                {['500','1000','2000','5000'].map(a => (
                  <button key={a} onClick={() => setTopUpAmt(a)}
                    style={btn({background: topUpAmt===a ? '#00e5a0' : '#111622', color: topUpAmt===a ? '#07090f' : '#7a8fa6', border:'1px solid', borderColor: topUpAmt===a ? '#00e5a0' : '#1e2d42', borderRadius:'6px', padding:'8px', fontSize:'12px', width:'100%'})}>
                    QAR {parseInt(a).toLocaleString()}
                  </button>
                ))}
              </div>
              <input value={topUpAmt} onChange={e => setTopUpAmt(e.target.value.replace(/\D/g,''))} placeholder="Or enter custom amount" style={inp}/>
            </div>
            <div style={{marginBottom:'20px'}}>
              <label style={lbl}>PAYMENT NOTE (OPTIONAL)</label>
              <input value={topUpNote} onChange={e => setTopUpNote(e.target.value)} placeholder="e.g. Cash received — Invoice #1042" style={inp}/>
            </div>
            <div style={{background:'rgba(0,229,160,.06)', border:'1px solid rgba(0,229,160,.2)', borderRadius:'6px', padding:'12px', marginBottom:'20px', fontSize:'11px', color:'#7a8fa6'}}>
              New balance: <strong style={{color:'#00e5a0', fontSize:'14px'}}>QAR {(selected.balance + (parseInt(topUpAmt)||0)).toLocaleString()}</strong>
            </div>
            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={() => { setShowTopUp(false); setTopUpAmt('500'); setTopUpNote('') }}
                style={btn({flex:1, background:'#111622', color:'#7a8fa6', border:'1px solid #1e2d42', padding:'11px'})}>Cancel</button>
              <button onClick={applyTopUp}
                style={btn({flex:2, background:'linear-gradient(135deg,#00e5a0,#00c98a)', color:'#07090f', padding:'11px'})}>
                ✓ Add QAR {parseInt(topUpAmt||0).toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Package Builder
      ══════════════════════════════════════════════════════════════════════ */}
      {showPkgBuilder && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.8)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
          <div style={{background:'#0f1520', border:'1px solid #1e2d42', borderRadius:'12px', width:'620px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,.6)'}}>
            <div style={{padding:'28px', borderBottom:'1px solid #1e2d42', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div style={{fontWeight:'900', fontSize:'18px'}}>{editPkg ? 'Edit Package' : 'Create New Package'}</div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginTop:'2px'}}>Configure price, margin, features and conditions</div>
              </div>
              <button onClick={() => setShowPkgBuilder(false)} style={btn({background:'#111622', color:'#7a8fa6', padding:'6px 10px', border:'1px solid #1e2d42'})}>✕</button>
            </div>
            <div style={{padding:'28px', display:'flex', flexDirection:'column', gap:'18px'}}>
              <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'14px'}}>
                <div><label style={lbl}>PACKAGE NAME</label><input value={pkgForm.name} onChange={e=>setPkgForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Business Pro" style={inp}/></div>
                <div><label style={lbl}>PRICE (QAR/mo)</label><input value={pkgForm.price} onChange={e=>setPkgForm(p=>({...p,price:e.target.value.replace(/\D/g,'')}))} placeholder="599" style={inp}/></div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>
                <div>
                  <label style={lbl}>YOUR PROFIT MARGIN (%)</label>
                  <div style={{position:'relative'}}>
                    <input value={pkgForm.margin} onChange={e=>setPkgForm(p=>({...p,margin:e.target.value.replace(/\D/g,'')}))} placeholder="25" style={inp}/>
                    {pkgForm.price && pkgForm.margin && (
                      <div style={{marginTop:'6px', fontSize:'11px', color:'#a78bfa'}}>
                        = QAR {Math.round((parseInt(pkgForm.price)||0)*(parseInt(pkgForm.margin)||0)/100)}/mo profit · QAR {Math.round((parseInt(pkgForm.price)||0)*(1-(parseInt(pkgForm.margin)||0)/100))}/mo cost
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label style={lbl}>ACCENT COLOR</label>
                  <div style={{display:'flex', gap:'8px', flexWrap:'wrap', paddingTop:'4px'}}>
                    {marginColors.map(c => (
                      <div key={c} onClick={() => setPkgForm(p=>({...p,color:c}))}
                        style={{width:'28px', height:'28px', borderRadius:'50%', background:c, cursor:'pointer', border: pkgForm.color===c ? '3px solid #fff' : '3px solid transparent', transition:'border .15s'}}/>
                    ))}
                  </div>
                </div>
              </div>
              <div><label style={lbl}>DESCRIPTION</label><input value={pkgForm.desc} onChange={e=>setPkgForm(p=>({...p,desc:e.target.value}))} placeholder="Short description of this package" style={inp}/></div>

              {/* Features */}
              <div>
                <label style={lbl}>FEATURES (what the client gets)</label>
                {pkgForm.features.map((f,i) => (
                  <div key={i} style={{display:'flex', gap:'8px', marginBottom:'8px'}}>
                    <input value={f} onChange={e=>updatePkgList('features',i,e.target.value)} placeholder={`Feature ${i+1}`} style={{...inp, flex:1}}/>
                    {pkgForm.features.length > 1 && <button onClick={() => removePkgListItem('features',i)} style={btn({background:'rgba(239,68,68,.1)', color:'#ef4444', padding:'8px 12px', border:'1px solid rgba(239,68,68,.2)' })}>✕</button>}
                  </div>
                ))}
              </div>

              {/* Conditions */}
              <div>
                <label style={lbl}>CONDITIONS & LIMITATIONS</label>
                {pkgForm.conditions.map((c,i) => (
                  <div key={i} style={{display:'flex', gap:'8px', marginBottom:'8px'}}>
                    <input value={c} onChange={e=>updatePkgList('conditions',i,e.target.value)} placeholder={`Condition ${i+1} — e.g. Max 3 WhatsApp numbers`} style={{...inp, flex:1}}/>
                    {pkgForm.conditions.length > 1 && <button onClick={() => removePkgListItem('conditions',i)} style={btn({background:'rgba(239,68,68,.1)', color:'#ef4444', padding:'8px 12px', border:'1px solid rgba(239,68,68,.2)' })}>✕</button>}
                  </div>
                ))}
              </div>

              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <span style={{fontSize:'12px', color:'#7a8fa6'}}>Active</span>
                  <button onClick={() => setPkgForm(p=>({...p,active:!p.active}))}
                    style={{width:'44px', height:'24px', borderRadius:'12px', border:'none', cursor:'pointer', background: pkgForm.active ? '#00e5a0' : '#1a2235', position:'relative', transition:'background .2s'}}>
                    <span style={{position:'absolute', top:'4px', left: pkgForm.active ? '22px' : '4px', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', transition:'left .2s', display:'block'}}></span>
                  </button>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                  <button onClick={() => setShowPkgBuilder(false)} style={btn({background:'#111622', color:'#7a8fa6', border:'1px solid #1e2d42', padding:'10px 20px'})}>Cancel</button>
                  <button onClick={savePkg} style={btn({background:'linear-gradient(135deg,#00e5a0,#00c98a)', color:'#07090f', padding:'10px 28px'})}>
                    {editPkg ? 'Save Changes' : 'Create Package'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Client Settings
      ══════════════════════════════════════════════════════════════════════ */}
      {showClientSettings && selected && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'#0f1520', border:'1px solid #1e2d42', padding:'32px', borderRadius:'12px', width:'500px', boxShadow:'0 24px 80px rgba(0,0,0,.6)'}}>
            <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px'}}>
              <div style={{width:'44px', height:'44px', borderRadius:'10px', background:selected.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px'}}>{settingsForm.logo}</div>
              <div>
                <div style={{fontWeight:'800', fontSize:'16px'}}>Client Settings</div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginTop:'2px'}}>{selected.name}</div>
              </div>
              <button onClick={() => setShowClientSettings(false)} style={{marginLeft:'auto', background:'none', border:'none', color:'#7a8fa6', fontSize:'20px', cursor:'pointer', lineHeight:1}}>✕</button>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'16px'}}>
              <div>
                <label style={lbl}>COMPANY NAME</label>
                <input value={settingsForm.name || ''} onChange={e => setSettingsForm(p => ({...p, name: e.target.value}))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>BUSINESS TYPE</label>
                <input value={settingsForm.type || ''} onChange={e => setSettingsForm(p => ({...p, type: e.target.value}))} style={inp}/>
              </div>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px', marginBottom:'16px'}}>
              <div>
                <label style={lbl}>PLAN</label>
                <select value={settingsForm.plan || 'Growth'} onChange={e => setSettingsForm(p => ({...p, plan: e.target.value}))} style={{...inp, cursor:'pointer'}}>
                  {Object.keys(PLAN_MARGINS).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>ACCOUNT STATUS</label>
                <select value={settingsForm.status || 'good'} onChange={e => setSettingsForm(p => ({...p, status: e.target.value}))} style={{...inp, cursor:'pointer'}}>
                  <option value="good">Active</option>
                  <option value="warn">Warning</option>
                  <option value="alert">Needs Attention</option>
                </select>
              </div>
              <div>
                <label style={lbl}>WHATSAPP</label>
                <select value={settingsForm.wa || 'Connected'} onChange={e => setSettingsForm(p => ({...p, wa: e.target.value}))} style={{...inp, cursor:'pointer'}}>
                  <option value="Connected">Connected</option>
                  <option value="Warning">Warning</option>
                  <option value="Disconnected">Disconnected</option>
                </select>
              </div>
            </div>

            <div style={{marginBottom:'24px'}}>
              <label style={lbl}>INTERNAL NOTES</label>
              <textarea value={settingsForm.notes || ''} onChange={e => setSettingsForm(p => ({...p, notes: e.target.value}))}
                placeholder="Internal notes about this client..."
                rows={3}
                style={{...inp, resize:'vertical', fontFamily:'inherit'}}/>
            </div>

            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={() => setShowClientSettings(false)} style={btn({flex:1, background:'#111622', color:'#7a8fa6', border:'1px solid #1e2d42', padding:'11px'})}>Cancel</button>
              <button onClick={saveClientSettings} style={btn({flex:2, background:'linear-gradient(135deg,#00e5a0,#00c98a)', color:'#07090f', padding:'11px'})}>✓ Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Add Client
      ══════════════════════════════════════════════════════════════════════ */}
      {showAdd && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'#0f1520', border:'1px solid #1e2d42', padding:'32px', borderRadius:'12px', width:'460px', boxShadow:'0 24px 80px rgba(0,0,0,.6)'}}>
            <div style={{fontWeight:'900', fontSize:'18px', marginBottom:'6px'}}>Add New Client</div>
            <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'24px'}}>Set up a new client account</div>
            <div style={{marginBottom:'16px'}}>
              <label style={lbl}>CHOOSE ICON</label>
              <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                {logos.map(l => (
                  <div key={l} onClick={() => setNewClient({...newClient, logo:l})}
                    style={{width:'38px', height:'38px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', cursor:'pointer', background: newClient.logo===l ? 'rgba(0,229,160,.18)' : '#111622', border:'1px solid', borderColor: newClient.logo===l ? '#00e5a0' : '#1e2d42'}}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
            {[{label:'COMPANY NAME',key:'name',placeholder:'e.g. Al Meera Markets'},{label:'BUSINESS TYPE',key:'type',placeholder:'e.g. Retail, Healthcare'}].map(f => (
              <div key={f.key} style={{marginBottom:'16px'}}>
                <label style={lbl}>{f.label}</label>
                <input value={newClient[f.key]} onChange={e => setNewClient({...newClient,[f.key]:e.target.value})} placeholder={f.placeholder} style={inp}/>
              </div>
            ))}
            <div style={{marginBottom:'24px'}}>
              <label style={lbl}>PLAN</label>
              <select value={newClient.plan} onChange={e => setNewClient({...newClient, plan:e.target.value})} style={{...inp, cursor:'pointer'}}>
                {Object.entries(PLAN_MARGINS).map(([k,v]) => (
                  <option key={k} value={k}>{k} — {Math.round(v*100)}% margin{k==='PAYG'?' · QAR 150 min':k==='Starter'?' · QAR 299/mo':k==='Growth'?' · QAR 599/mo':' · QAR 1,299/mo'}</option>
                ))}
              </select>
            </div>
            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={() => setShowAdd(false)} style={btn({flex:1, background:'#111622', color:'#7a8fa6', border:'1px solid #1e2d42', padding:'11px'})}>Cancel</button>
              <button onClick={addClient} style={btn({flex:2, background:'linear-gradient(135deg,#00e5a0,#00c98a)', color:'#07090f', padding:'11px'})}>✓ Create Client</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
