'use client'
import NavSidebar from '@/components/NavSidebar'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

// ── Permission matrix per role ──────────────────────────────────────────────
const ALL_PERMISSIONS = [
  { key:'inbox_view',        label:'View Inbox',          group:'Inbox' },
  { key:'inbox_reply',       label:'Reply Messages',      group:'Inbox' },
  { key:'inbox_assign',      label:'Assign Conversations',group:'Inbox' },
  { key:'inbox_delete',      label:'Delete Conversations',group:'Inbox' },
  { key:'contacts_view',     label:'View Contacts',       group:'Contacts' },
  { key:'contacts_create',   label:'Create Contacts',     group:'Contacts' },
  { key:'contacts_edit',     label:'Edit Contacts',       group:'Contacts' },
  { key:'contacts_delete',   label:'Delete Contacts',     group:'Contacts' },
  { key:'contacts_import',   label:'Import Contacts',     group:'Contacts' },
  { key:'contacts_export',   label:'Export Contacts',     group:'Contacts' },
  { key:'campaigns_view',    label:'View Campaigns',      group:'Campaigns' },
  { key:'campaigns_create',  label:'Create Campaigns',    group:'Campaigns' },
  { key:'campaigns_send',    label:'Send Campaigns',      group:'Campaigns' },
  { key:'analytics_view',    label:'View Analytics',      group:'Analytics' },
  { key:'reports_view',      label:'View Reports',        group:'Reports' },
  { key:'reports_export',    label:'Export Reports',      group:'Reports' },
  { key:'chatbot_view',      label:'View Chatbot',        group:'Chatbot' },
  { key:'chatbot_edit',      label:'Edit & Publish Chatbot',group:'Chatbot' },
  { key:'team_view',         label:'View Team',           group:'Admin' },
  { key:'team_manage',       label:'Manage Team',         group:'Admin' },
  { key:'billing_view',      label:'View Billing',        group:'Admin' },
  { key:'billing_manage',    label:'Manage Billing',      group:'Admin' },
  { key:'settings_view',     label:'View Settings',       group:'Admin' },
  { key:'settings_edit',     label:'Edit Settings',       group:'Admin' },
]

const DEFAULT_ROLE_PERMS = {
  receptionist: new Set([
    'inbox_view','inbox_reply','contacts_view',
  ]),
  marketing: new Set([
    'inbox_view','inbox_reply','inbox_assign',
    'contacts_view','contacts_create','contacts_edit','contacts_import','contacts_export',
    'campaigns_view','campaigns_create','campaigns_send',
    'analytics_view','reports_view','reports_export',
  ]),
  manager: new Set([
    'inbox_view','inbox_reply','inbox_assign','inbox_delete',
    'contacts_view','contacts_create','contacts_edit','contacts_delete','contacts_import','contacts_export',
    'campaigns_view','campaigns_create','campaigns_send',
    'analytics_view','reports_view','reports_export',
    'chatbot_view','chatbot_edit',
    'team_view','settings_view',
  ]),
  owner: new Set(ALL_PERMISSIONS.map(p => p.key)),
}

const ROLE_LABELS = {
  receptionist: { label:'Receptionist', color:'#3b82f6', desc:'Front desk — inbox & booking confirmations' },
  marketing:    { label:'Marketing Manager', color:'#a78bfa', desc:'Campaigns, contacts, analytics & reports' },
  manager:      { label:'Client Manager', color:'#f97316', desc:'Full CRM access — no billing/team' },
  owner:        { label:'Owner / Admin', color:'#00e5a0', desc:'Full access including billing & team' },
}

const PLANS = [
  {
    id:'payg', name:'Pay As You Use', price:'QAR 150', period:'/mo min',
    color:'#fbbf24', popular:false,
    features:['QAR 0.10 per message','QAR 0.15 per AI response','Up to 500 contacts','2 team members','Basic inbox'],
    note:'No commitment. Billed on usage.',
  },
  {
    id:'starter', name:'Starter', price:'QAR 299', period:'/month',
    color:'#3b82f6', popular:false,
    features:['3,000 messages/mo','1,000 AI responses','Up to 2,000 contacts','5 team members','Analytics & reports'],
  },
  {
    id:'growth', name:'Growth', price:'QAR 599', period:'/month',
    color:'#00e5a0', popular:true,
    features:['10,000 messages/mo','5,000 AI responses','Unlimited contacts','15 team members','Advanced AI chatbot','Priority support'],
  },
  {
    id:'enterprise', name:'Enterprise', price:'QAR 1,299', period:'/month',
    color:'#a78bfa', popular:false,
    features:['Unlimited messages','Unlimited AI responses','Unlimited contacts','Unlimited team members','Dedicated support','White label option','Custom integrations'],
  },
]

const mockUsage = {
  plan: 'Growth', planColor:'#00e5a0',
  balance: 'QAR 0', nextBilling:'2026-06-15',
  messages: { used:6240, limit:10000 },
  ai: { used:2180, limit:5000 },
  contacts: { used:847, limit:99999 },
  team: { used:4, limit:15 },
}

const inp = {width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box'}
const lbl = {fontSize:'10px', color:'#7a8fa6', marginBottom:'6px', display:'block'}

export default function Settings() {
  const [activeTab, setActiveTab]   = useState('usage')
  const [saved, setSaved]           = useState('')
  const [team, setTeam]             = useState([])
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState('receptionist')
  const [editRole, setEditRole]       = useState(null)
  const [rolePerms, setRolePerms]     = useState(() => {
    const copy = {}
    Object.entries(DEFAULT_ROLE_PERMS).forEach(([k,v]) => copy[k] = new Set(v))
    return copy
  })
  const [orgName, setOrgName]   = useState('')
  const [orgPhone, setOrgPhone] = useState('')
  const [orgEmail, setOrgEmail] = useState('')
  const [orgCity,  setOrgCity]  = useState('Doha')
  const [aiEnabled, setAiEnabled]   = useState(true)
  const [aiLang, setAiLang]         = useState('en')
  const [autoReply, setAutoReply]   = useState(true)
  const [autoMsg, setAutoMsg]       = useState('Hello! We will get back to you within a few minutes. Thank you for reaching out.')
  const [waToken, setWaToken]       = useState('')
  const [waPhone, setWaPhone]       = useState('')
  const [addCredit, setAddCredit]   = useState('100')
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    api.getSettings().then(s => {
      if (!s) return
      setOrgName(s.businessName || s.name || '')
      setOrgPhone(s.phone || '')
      setOrgEmail(s.email || '')
      setOrgCity(s.city || 'Doha')
      if (s.aiEnabled !== undefined) setAiEnabled(s.aiEnabled)
      if (s.aiLanguage) setAiLang(s.aiLanguage)
      if (s.autoReply !== undefined) setAutoReply(s.autoReply)
      if (s.autoMessage) setAutoMsg(s.autoMessage)
    }).catch(() => {})

    api.getProfile().then(u => {
      setTeam(prev => {
        if (prev.some(m => m.email === u.email)) return prev
        return [{ id: u.id, name: u.name, email: u.email, role: u.role?.toLowerCase() || 'owner', status: 'active', lastActive: 'Now' }, ...prev]
      })
    }).catch(() => {})
  }, [])

  const saveMsg = (msg) => { setSaved(msg); setTimeout(() => setSaved(''), 2000) }

  const togglePerm = (role, key) => {
    if (role === 'owner') return
    setRolePerms(prev => {
      const next = { ...prev, [role]: new Set(prev[role]) }
      next[role].has(key) ? next[role].delete(key) : next[role].add(key)
      return next
    })
  }

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return
    try {
      await api.inviteTeamMember?.(inviteEmail, inviteRole.toUpperCase()).catch(() => null)
    } catch {}
    setTeam(prev => [...prev, { id: Date.now(), name: inviteEmail.split('@')[0], email: inviteEmail, role: inviteRole, status:'pending', lastActive:'—' }])
    setInviteEmail('')
    setShowInvite(false)
    saveMsg('Invitation sent!')
  }

  const removeTeamMember = (id) => setTeam(prev => prev.filter(m => m.id !== id))

  const checkout = async (planId) => {
    setCheckoutLoading(planId)
    try {
      const data = await api.createCheckout(planId)
      if (data.url) window.open(data.url, '_blank')
      else saveMsg('Plan selected — billing coming soon!')
    } catch { saveMsg('Checkout coming soon!') }
    setCheckoutLoading(false)
  }

  const tabs = [
    { id:'usage',    icon:'📊', label:'Usage & Balance' },
    { id:'team',     icon:'👥', label:'Team & Roles' },
    { id:'billing',  icon:'💳', label:'Plans' },
    { id:'profile',  icon:'🏢', label:'Organization' },
    { id:'whatsapp', icon:'💬', label:'WhatsApp' },
    { id:'ai',       icon:'🤖', label:'AI Settings' },
    { id:'security', icon:'🔐', label:'Security' },
  ]

  const groups = [...new Set(ALL_PERMISSIONS.map(p => p.group))]

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>

      {/* Top bar */}
      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{fontSize:'12px', color:'#7a8fa6'}}>/  Settings</div>
        {saved && <span style={{fontSize:'11px', color:'#00e5a0', marginLeft:'8px'}}>✅ {saved}</span>}
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>

        {/* Side nav */}
        <NavSidebar current="settings" />

        {/* Settings sidebar */}
        <div style={{width:'200px', borderRight:'1px solid #1a2235', background:'#0c0f1a', padding:'16px 0', flexShrink:0}}>
          <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', padding:'0 16px', marginBottom:'10px'}}>SETTINGS</div>
          {tabs.map(t => (
            <div key={t.id} onClick={() => setActiveTab(t.id)}
              style={{padding:'10px 16px', cursor:'pointer', fontSize:'12px', display:'flex', alignItems:'center', gap:'10px', color: activeTab===t.id ? '#e2e8f0' : '#7a8fa6', background: activeTab===t.id ? 'rgba(0,229,160,.07)' : 'none', borderLeft: activeTab===t.id ? '2px solid #00e5a0' : '2px solid transparent'}}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </div>
          ))}
        </div>

        <div style={{flex:1, overflowY:'auto', padding:'28px', maxWidth:'900px'}}>

          {/* ── USAGE & BALANCE ─────────────────────────────────── */}
          {activeTab === 'usage' && (
            <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
              <div>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'4px'}}>Usage & Balance</div>
                <div style={{fontSize:'12px', color:'#7a8fa6'}}>Monitor your usage and top up your account</div>
              </div>

              {/* Plan + Balance banner */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                <div style={{background:'#0f1520', border:`1px solid ${mockUsage.planColor}40`, padding:'20px', borderRadius:'4px', borderTop:`2px solid ${mockUsage.planColor}`}}>
                  <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', marginBottom:'8px'}}>CURRENT PLAN</div>
                  <div style={{fontSize:'22px', fontWeight:'800', color:mockUsage.planColor, marginBottom:'4px'}}>{mockUsage.plan}</div>
                  <div style={{fontSize:'11px', color:'#7a8fa6'}}>Next billing: {mockUsage.nextBilling}</div>
                  <button onClick={() => setActiveTab('billing')} style={{marginTop:'12px', padding:'6px 14px', background:`${mockUsage.planColor}20`, border:`1px solid ${mockUsage.planColor}40`, borderRadius:'4px', color:mockUsage.planColor, fontSize:'11px', cursor:'pointer', fontWeight:'600'}}>
                    Upgrade Plan →
                  </button>
                </div>
                <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px', borderRadius:'4px'}}>
                  <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', marginBottom:'8px'}}>ACCOUNT BALANCE</div>
                  <div style={{fontSize:'22px', fontWeight:'800', color:'#fbbf24', marginBottom:'4px'}}>{mockUsage.balance}</div>
                  <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'12px'}}>Pay-as-you-go credit</div>
                  <div style={{display:'flex', gap:'6px'}}>
                    {['50','100','200','500'].map(amt => (
                      <button key={amt} onClick={() => setAddCredit(amt)}
                        style={{padding:'5px 10px', background: addCredit===amt ? '#fbbf24' : '#111622', border:'1px solid #1a2235', borderRadius:'3px', color: addCredit===amt ? '#07090f' : '#7a8fa6', fontSize:'10px', cursor:'pointer', fontWeight: addCredit===amt ? '700' : '400'}}>
                        +{amt}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => saveMsg(`QAR ${addCredit} credit added!`)} style={{marginTop:'10px', width:'100%', padding:'8px', background:'#fbbf24', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>
                    Add QAR {addCredit} Credit
                  </button>
                </div>
              </div>

              {/* Usage bars */}
              <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px', borderRadius:'4px'}}>
                <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'16px'}}>This Month's Usage</div>
                {[
                  { label:'Messages Sent', ...mockUsage.messages, color:'#00e5a0', unit:'msgs' },
                  { label:'AI Responses', ...mockUsage.ai, color:'#a78bfa', unit:'responses' },
                  { label:'Active Contacts', ...mockUsage.contacts, color:'#3b82f6', unit:'contacts', unlimitedLabel:'Unlimited' },
                  { label:'Team Members', ...mockUsage.team, color:'#f97316', unit:'members' },
                ].map(u => {
                  const pct = u.unlimitedLabel ? 0 : Math.round((u.used/u.limit)*100)
                  return (
                    <div key={u.label} style={{marginBottom:'16px'}}>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'6px'}}>
                        <div style={{fontSize:'12px', color:'#7a8fa6'}}>{u.label}</div>
                        <div style={{fontSize:'12px', fontWeight:'600', color:u.color}}>
                          {u.used.toLocaleString()} / {u.unlimitedLabel || u.limit.toLocaleString()} {u.unit}
                          {!u.unlimitedLabel && <span style={{fontSize:'10px', color:'#3d4f63', marginLeft:'6px'}}>({pct}%)</span>}
                        </div>
                      </div>
                      {!u.unlimitedLabel && (
                        <div style={{height:'8px', background:'#1a2235', borderRadius:'4px', overflow:'hidden'}}>
                          <div style={{height:'100%', width:`${pct}%`, background:u.color, borderRadius:'4px', transition:'width .5s', opacity: pct>85 ? 1 : 0.8}}></div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Usage pricing */}
              <div style={{background:'rgba(251,191,36,.05)', border:'1px solid rgba(251,191,36,.2)', padding:'16px', borderRadius:'4px'}}>
                <div style={{fontSize:'11px', fontWeight:'700', color:'#fbbf24', marginBottom:'8px'}}>Pay-As-You-Go Rates (if you exceed your plan)</div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', fontSize:'11px', color:'#7a8fa6'}}>
                  <div>💬 Message: <strong style={{color:'#e2e8f0'}}>QAR 0.10</strong></div>
                  <div>🤖 AI Response: <strong style={{color:'#e2e8f0'}}>QAR 0.15</strong></div>
                  <div>📊 Min charge: <strong style={{color:'#e2e8f0'}}>QAR 150/mo</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* ── TEAM & ROLES ─────────────────────────────────────── */}
          {activeTab === 'team' && (
            <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div>
                  <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'4px'}}>Team & Roles</div>
                  <div style={{fontSize:'12px', color:'#7a8fa6'}}>Invite staff and control what each role can access</div>
                </div>
                <button onClick={() => setShowInvite(!showInvite)} style={{padding:'8px 16px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>
                  + Invite Member
                </button>
              </div>

              {/* Invite form */}
              {showInvite && (
                <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px', borderRadius:'4px'}}>
                  <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'14px'}}>Invite New Team Member</div>
                  <div style={{display:'grid', gridTemplateColumns:'2fr 1fr auto', gap:'10px', alignItems:'end'}}>
                    <div>
                      <label style={lbl}>EMAIL ADDRESS</label>
                      <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="staff@yourclinic.qa" style={inp}/>
                    </div>
                    <div>
                      <label style={lbl}>ROLE</label>
                      <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{...inp, cursor:'pointer'}}>
                        {Object.entries(ROLE_LABELS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <button onClick={inviteMember} style={{padding:'10px 18px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer', height:'40px'}}>
                      Send Invite
                    </button>
                  </div>
                  <div style={{marginTop:'10px', padding:'10px', background:`${ROLE_LABELS[inviteRole].color}10`, border:`1px solid ${ROLE_LABELS[inviteRole].color}30`, borderRadius:'4px', fontSize:'11px', color:'#7a8fa6'}}>
                    <strong style={{color:ROLE_LABELS[inviteRole].color}}>{ROLE_LABELS[inviteRole].label}:</strong> {ROLE_LABELS[inviteRole].desc}
                  </div>
                </div>
              )}

              {/* Team list */}
              <div style={{background:'#0f1520', border:'1px solid #1a2235', borderRadius:'4px', overflow:'hidden'}}>
                <div style={{display:'grid', gridTemplateColumns:'2fr 2fr 1.5fr 1fr 1fr', padding:'10px 16px', borderBottom:'1px solid #1a2235', background:'#0c0f1a'}}>
                  {['MEMBER','EMAIL','ROLE','STATUS','LAST ACTIVE'].map(h => (
                    <div key={h} style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px'}}>{h}</div>
                  ))}
                </div>
                {team.map(m => (
                  <div key={m.id} style={{display:'grid', gridTemplateColumns:'2fr 2fr 1.5fr 1fr 1fr', padding:'12px 16px', borderBottom:'1px solid #1a2235', alignItems:'center'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <div style={{width:'30px', height:'30px', borderRadius:'50%', background:ROLE_LABELS[m.role].color+'30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', color:ROLE_LABELS[m.role].color, flexShrink:0}}>
                        {m.name[0]}
                      </div>
                      <div style={{fontSize:'12px', fontWeight:'600'}}>{m.name}</div>
                    </div>
                    <div style={{fontSize:'11px', color:'#7a8fa6'}}>{m.email}</div>
                    <div>
                      <select value={m.role} onChange={e => setTeam(prev => prev.map(t => t.id===m.id ? {...t,role:e.target.value} : t))}
                        style={{background:'#111622', border:'1px solid #1a2235', borderRadius:'3px', padding:'4px 8px', color:ROLE_LABELS[m.role].color, fontSize:'11px', outline:'none', cursor:'pointer', fontWeight:'600'}}>
                        {Object.entries(ROLE_LABELS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <span style={{fontSize:'10px', padding:'2px 8px', borderRadius:'2px', background: m.status==='active' ? 'rgba(0,229,160,.1)' : 'rgba(251,191,36,.1)', color: m.status==='active' ? '#00e5a0' : '#fbbf24', fontWeight:'600'}}>
                        {m.status}
                      </span>
                    </div>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                      <span style={{fontSize:'11px', color:'#3d4f63'}}>{m.lastActive}</span>
                      {m.role !== 'owner' && (
                        <button onClick={() => removeTeamMember(m.id)} style={{padding:'3px 8px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'3px', color:'#ef4444', fontSize:'9px', cursor:'pointer'}}>Remove</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Permissions matrix */}
              <div style={{background:'#0f1520', border:'1px solid #1a2235', borderRadius:'4px', overflow:'hidden'}}>
                <div style={{padding:'16px 20px', borderBottom:'1px solid #1a2235', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:'700', fontSize:'13px'}}>Permission Matrix</div>
                    <div style={{fontSize:'11px', color:'#3d4f63', marginTop:'2px'}}>Toggle to customize each role's access. Owner always has full access.</div>
                  </div>
                  <button onClick={() => saveMsg('Permissions saved!')} style={{padding:'6px 14px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'11px', cursor:'pointer'}}>Save Permissions</button>
                </div>

                {/* Header row */}
                <div style={{display:'grid', gridTemplateColumns:'220px repeat(4, 1fr)', padding:'10px 16px', borderBottom:'1px solid #1a2235', background:'#0c0f1a', gap:'4px'}}>
                  <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px'}}>PERMISSION</div>
                  {Object.entries(ROLE_LABELS).map(([k,v]) => (
                    <div key={k} style={{fontSize:'9px', color:v.color, letterSpacing:'1px', textAlign:'center', fontWeight:'700'}}>{v.label.toUpperCase()}</div>
                  ))}
                </div>

                {groups.map(group => (
                  <div key={group}>
                    <div style={{padding:'7px 16px', background:'#0c0f1a', fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', borderBottom:'1px solid #1a2235'}}>{group.toUpperCase()}</div>
                    {ALL_PERMISSIONS.filter(p => p.group === group).map(perm => (
                      <div key={perm.key} style={{display:'grid', gridTemplateColumns:'220px repeat(4, 1fr)', padding:'9px 16px', borderBottom:'1px solid #0c0f1a', alignItems:'center', gap:'4px'}}>
                        <div style={{fontSize:'11px', color:'#7a8fa6'}}>{perm.label}</div>
                        {Object.keys(ROLE_LABELS).map(role => {
                          const has = rolePerms[role]?.has(perm.key)
                          const isOwner = role === 'owner'
                          return (
                            <div key={role} style={{textAlign:'center'}}>
                              <button onClick={() => togglePerm(role, perm.key)}
                                style={{width:'28px', height:'16px', borderRadius:'8px', border:'none', cursor: isOwner ? 'default' : 'pointer', background: has ? ROLE_LABELS[role].color : '#1a2235', transition:'background .2s', position:'relative', outline:'none'}}>
                                <span style={{position:'absolute', top:'2px', left: has ? '14px' : '2px', width:'12px', height:'12px', borderRadius:'50%', background:'#fff', transition:'left .2s', display:'block'}}></span>
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── BILLING / PLANS ──────────────────────────────────── */}
          {activeTab === 'billing' && (
            <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
              <div>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'4px'}}>Plans & Billing</div>
                <div style={{fontSize:'12px', color:'#7a8fa6'}}>Choose a plan that fits your business size</div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'14px'}}>
                {PLANS.map(plan => (
                  <div key={plan.id} style={{background:'#0f1520', border:`1px solid ${plan.popular ? plan.color : '#1a2235'}`, borderRadius:'4px', padding:'20px', position:'relative', borderTop:`2px solid ${plan.color}`}}>
                    {plan.popular && <div style={{position:'absolute', top:'-1px', right:'16px', fontSize:'9px', padding:'3px 8px', background:plan.color, color:'#07090f', fontWeight:'800', borderRadius:'0 0 4px 4px', letterSpacing:'1px'}}>POPULAR</div>}
                    <div style={{fontSize:'13px', fontWeight:'700', color:plan.color, marginBottom:'4px'}}>{plan.name}</div>
                    <div style={{marginBottom:'16px'}}>
                      <span style={{fontSize:'28px', fontWeight:'800'}}>{plan.price}</span>
                      <span style={{fontSize:'12px', color:'#7a8fa6'}}>{plan.period}</span>
                    </div>
                    {plan.note && <div style={{fontSize:'10px', color:'#fbbf24', marginBottom:'12px', padding:'6px 8px', background:'rgba(251,191,36,.08)', borderRadius:'3px'}}>{plan.note}</div>}
                    <div style={{marginBottom:'16px'}}>
                      {plan.features.map(f => (
                        <div key={f} style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'7px', display:'flex', alignItems:'center', gap:'6px'}}>
                          <span style={{color:plan.color}}>✓</span> {f}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => checkout(plan.id)} disabled={checkoutLoading === plan.id}
                      style={{width:'100%', padding:'9px', background: plan.popular ? plan.color : `${plan.color}20`, border:`1px solid ${plan.color}40`, borderRadius:'4px', color: plan.popular ? '#07090f' : plan.color, fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>
                      {checkoutLoading === plan.id ? 'Processing...' : mockUsage.plan === plan.name ? '✅ Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{background:'rgba(0,229,160,.05)', border:'1px solid rgba(0,229,160,.15)', padding:'14px', borderRadius:'4px', fontSize:'11px', color:'#7a8fa6', lineHeight:'1.8'}}>
                <strong style={{color:'#00e5a0'}}>All plans include:</strong> WhatsApp integration, AI chatbot, contact management, multi-channel inbox, analytics dashboard, 99.9% uptime SLA, data hosted in Qatar region.
              </div>
            </div>
          )}

          {/* ── ORGANIZATION PROFILE ─────────────────────────────── */}
          {activeTab === 'profile' && (
            <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
              <div>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'4px'}}>Organization Profile</div>
                <div style={{fontSize:'12px', color:'#7a8fa6'}}>Business information shown to your clients</div>
              </div>
              <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'4px', display:'flex', flexDirection:'column', gap:'14px'}}>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>
                  <div><label style={lbl}>ORGANIZATION NAME</label><input value={orgName} onChange={e=>setOrgName(e.target.value)} style={inp}/></div>
                  <div><label style={lbl}>CITY</label><input value={orgCity} onChange={e=>setOrgCity(e.target.value)} style={inp}/></div>
                  <div><label style={lbl}>PHONE</label><input value={orgPhone} onChange={e=>setOrgPhone(e.target.value)} style={inp}/></div>
                  <div><label style={lbl}>EMAIL</label><input value={orgEmail} onChange={e=>setOrgEmail(e.target.value)} style={inp}/></div>
                </div>
                <div><label style={lbl}>BUSINESS TYPE</label>
                  <select style={{...inp, cursor:'pointer'}}>
                    {['Medical Clinic','Dental Clinic','Real Estate','Retail / E-commerce','Restaurant','Salon & Beauty','Other'].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <button onClick={async () => {
                  try {
                    await api.saveSettings({ businessName: orgName, phone: orgPhone, email: orgEmail, city: orgCity })
                    saveMsg('Profile saved!')
                  } catch { saveMsg('Save failed — try again') }
                }} style={{alignSelf:'flex-start', padding:'9px 20px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>Save Profile</button>
              </div>
            </div>
          )}

          {/* ── WHATSAPP ──────────────────────────────────────────── */}
          {activeTab === 'whatsapp' && (
            <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
              <div>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'4px'}}>WhatsApp Integration</div>
                <div style={{fontSize:'12px', color:'#7a8fa6'}}>Connect your WhatsApp Business API account</div>
              </div>
              <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'4px', display:'flex', flexDirection:'column', gap:'14px'}}>
                <div><label style={lbl}>ACCESS TOKEN</label><input value={waToken} onChange={e=>setWaToken(e.target.value)} type="password" placeholder="EAABwzLixnjYBO..." style={inp}/></div>
                <div><label style={lbl}>PHONE NUMBER ID</label><input value={waPhone} onChange={e=>setWaPhone(e.target.value)} placeholder="1234567890" style={inp}/></div>
                <div style={{padding:'12px', background:'rgba(0,229,160,.05)', border:'1px solid rgba(0,229,160,.15)', borderRadius:'4px', fontSize:'11px', color:'#7a8fa6', lineHeight:'1.7'}}>
                  <strong style={{color:'#00e5a0'}}>Webhook URL:</strong><br/>
                  <code style={{color:'#e2e8f0', fontSize:'12px'}}>https://api.hayyamed.ai/api/v1/whatsapp/webhook</code><br/>
                  <strong style={{color:'#00e5a0'}}>Verify Token:</strong> <code style={{color:'#e2e8f0'}}>hayyamed_webhook_2024</code>
                </div>
                <button onClick={async () => {
                  try {
                    await api.saveSettings({ waToken, waPhone })
                    saveMsg('WhatsApp settings saved!')
                  } catch { saveMsg('Save failed — try again') }
                }} style={{alignSelf:'flex-start', padding:'9px 20px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>Save & Test Connection</button>
              </div>
            </div>
          )}

          {/* ── AI SETTINGS ───────────────────────────────────────── */}
          {activeTab === 'ai' && (
            <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
              <div>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'4px'}}>AI Settings</div>
                <div style={{fontSize:'12px', color:'#7a8fa6'}}>Configure how your AI assistant responds to clients</div>
              </div>
              <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'4px', display:'flex', flexDirection:'column', gap:'16px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:'14px', borderBottom:'1px solid #1a2235'}}>
                  <div>
                    <div style={{fontSize:'13px', fontWeight:'600'}}>AI Auto-Reply</div>
                    <div style={{fontSize:'11px', color:'#7a8fa6', marginTop:'2px'}}>AI responds to messages automatically</div>
                  </div>
                  <button onClick={() => setAiEnabled(!aiEnabled)} style={{width:'44px', height:'24px', borderRadius:'12px', border:'none', cursor:'pointer', background: aiEnabled ? '#00e5a0' : '#1a2235', position:'relative', transition:'background .2s'}}>
                    <span style={{position:'absolute', top:'4px', left: aiEnabled ? '22px' : '4px', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', transition:'left .2s', display:'block'}}></span>
                  </button>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:'14px', borderBottom:'1px solid #1a2235'}}>
                  <div>
                    <div style={{fontSize:'13px', fontWeight:'600'}}>Auto-Reply When Away</div>
                    <div style={{fontSize:'11px', color:'#7a8fa6', marginTop:'2px'}}>Send automatic message outside working hours</div>
                  </div>
                  <button onClick={() => setAutoReply(!autoReply)} style={{width:'44px', height:'24px', borderRadius:'12px', border:'none', cursor:'pointer', background: autoReply ? '#00e5a0' : '#1a2235', position:'relative', transition:'background .2s'}}>
                    <span style={{position:'absolute', top:'4px', left: autoReply ? '22px' : '4px', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', transition:'left .2s', display:'block'}}></span>
                  </button>
                </div>
                <div><label style={lbl}>AWAY MESSAGE</label><textarea value={autoMsg} onChange={e=>setAutoMsg(e.target.value)} rows={3} style={{...inp, resize:'vertical'}}/></div>
                <div><label style={lbl}>RESPONSE LANGUAGE</label>
                  <select value={aiLang} onChange={e=>setAiLang(e.target.value)} style={{...inp, cursor:'pointer'}}>
                    <option value="en">English — Default</option>
                    <option value="both">English + Auto-detect language</option>
                  </select>
                </div>
                <div><label style={lbl}>AI MODEL</label>
                  <select style={{...inp, cursor:'pointer'}}>
                    <option>GPT-4o (Recommended — most accurate)</option>
                    <option>GPT-3.5 Turbo (Faster — lower cost)</option>
                  </select>
                </div>
                <button onClick={async () => {
                  try {
                    await api.saveSettings({ aiEnabled, aiLanguage: aiLang, autoReply, autoMessage: autoMsg })
                    saveMsg('AI settings saved!')
                  } catch { saveMsg('Save failed') }
                }} style={{alignSelf:'flex-start', padding:'9px 20px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>Save AI Settings</button>
              </div>
            </div>
          )}

          {/* ── SECURITY ──────────────────────────────────────────── */}
          {activeTab === 'security' && (
            <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
              <div>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'4px'}}>Security</div>
                <div style={{fontSize:'12px', color:'#7a8fa6'}}>Protect your account</div>
              </div>
              <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'4px', display:'flex', flexDirection:'column', gap:'14px'}}>
                <div><label style={lbl}>CURRENT PASSWORD</label><input type="password" placeholder="••••••••" style={inp}/></div>
                <div><label style={lbl}>NEW PASSWORD</label><input type="password" placeholder="••••••••" style={inp}/></div>
                <div><label style={lbl}>CONFIRM NEW PASSWORD</label><input type="password" placeholder="••••••••" style={inp}/></div>
                <button onClick={() => saveMsg('Password updated!')} style={{alignSelf:'flex-start', padding:'9px 20px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>Update Password</button>
              </div>
              <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'4px'}}>
                <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'4px'}}>Two-Factor Authentication</div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'14px'}}>Add an extra layer of security to your account</div>
                <button onClick={() => saveMsg('2FA setup coming soon!')} style={{padding:'9px 20px', background:'rgba(167,139,250,.1)', border:'1px solid rgba(167,139,250,.3)', borderRadius:'4px', color:'#a78bfa', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>Enable 2FA</button>
              </div>
              <div style={{background:'rgba(239,68,68,.05)', border:'1px solid rgba(239,68,68,.2)', padding:'20px', borderRadius:'4px'}}>
                <div style={{fontWeight:'700', fontSize:'13px', color:'#ef4444', marginBottom:'4px'}}>Danger Zone</div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'14px'}}>Permanently delete your organization and all data</div>
                <button style={{padding:'8px 16px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'4px', color:'#ef4444', fontSize:'12px', cursor:'pointer'}}>Delete Organization</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
