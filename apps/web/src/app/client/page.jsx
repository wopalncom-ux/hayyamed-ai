'use client'
import { useState, useEffect } from 'react'
import { getAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { useIsMobile } from '@/lib/useIsMobile'
import ClientInbox from '@/components/ClientInbox'

const card = { background:'#0f1520', border:'1px solid #1e2d42', borderRadius:'10px', padding:'20px' }
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const STATUS_TAG = { NEW:'New Lead', ACTIVE:'Active', QUALIFIED:'Qualified', PROPOSAL:'Proposal', WON:'Won', LOST:'Lost', INACTIVE:'Inactive' }
const STATUS_COLOR = { NEW:'#3b82f6', ACTIVE:'#D8B16A', QUALIFIED:'#a78bfa', PROPOSAL:'#f97316', WON:'#D8B16A', LOST:'#ef4444', INACTIVE:'#64748b' }

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function ClientPortal() {
  const isMobile = useIsMobile()
  const [auth,      setAuth]      = useState({})
  const [stats,     setStats]     = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [convos,    setConvos]    = useState([])
  const [today,     setToday]     = useState(null)
  const [me,        setMe]        = useState(null)   // portal identity + permissions
  const [team,      setTeam]      = useState([])
  const [teamMsg,   setTeamMsg]   = useState(null)
  const [invite,    setInvite]    = useState({ email: '', name: '', clientRole: 'agent' })
  const can = (p) => !!me && Array.isArray(me.permissions) && me.permissions.includes(p)
  const [loading,   setLoading]   = useState(true)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiMsg,     setAiMsg]     = useState('')
  const [aiChat,    setAiChat]    = useState([
    { from:'ai', text:"Hello! I'm your AI assistant. How can I help you today?" }
  ])
  const [aiLoading, setAiLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const a = getAuth()
    setAuth(a)
    Promise.all([
      api.getFullStats().catch(() => null),
      api.getAnalytics('7days').catch(() => null),
      api.getCampaigns({ limit: 5 }).catch(() => ({ data: [] })),
      api.getConversations({ limit: 5 }).catch(() => ({ data: [] })),
      api.getToday().catch(() => null),
    ]).then(([s, an, c, cv, td]) => {
      setStats(s)
      setAnalytics(an)
      setCampaigns(Array.isArray(c) ? c : (c?.data || []))
      setConvos(Array.isArray(cv) ? cv : (cv?.data || []))
      setToday(td)
      setLoading(false)
    })
    api.getPortalMe().then(setMe).catch(() => {})
  }, [])

  const loadTeam = () => api.getPortalTeam().then(t => setTeam(Array.isArray(t) ? t : [])).catch(() => {})
  useEffect(() => { if (activeTab === 'team') loadTeam() }, [activeTab])

  const ROLE_LABEL = { owner: 'Client Owner', manager: 'Manager', agent: 'Agent', viewer: 'Viewer', billing: 'Billing Viewer' }
  const submitInvite = async () => {
    setTeamMsg(null)
    try {
      const r = await api.invitePortalMember(invite)
      setTeamMsg({ ok: true, text: `Invited ${r.email} — temp password: ${r.password}` })
      setInvite({ email: '', name: '', clientRole: 'agent' }); loadTeam()
    } catch (e) { setTeamMsg({ ok: false, text: e?.message || 'Invite failed' }) }
  }
  const setMemberActive = async (m, isActive) => { try { await api.updatePortalMember(m.id, { isActive }); loadTeam() } catch (e) { setTeamMsg({ ok: false, text: e?.message || 'Update failed' }) } }
  const setMemberRole = async (m, clientRole) => { try { await api.updatePortalMember(m.id, { clientRole }); loadTeam() } catch (e) { setTeamMsg({ ok: false, text: e?.message || 'Update failed' }) } }
  const removeMember = async (m) => { if (!confirm(`Remove ${m.name || m.email}?`)) return; try { await api.removePortalMember(m.id); loadTeam() } catch (e) { setTeamMsg({ ok: false, text: e?.message || 'Remove failed' }) } }

  const sendAiMsg = async () => {
    if (!aiMsg.trim()) return
    const userMsg = aiMsg.trim()
    setAiChat(p => [...p, { from:'user', text: userMsg }])
    setAiMsg('')
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message: userMsg, context:'client-portal' }),
      })
      const data = await res.json()
      setAiChat(p => [...p, { from:'ai', text: data.reply || data.message || 'I can help you with insights about your account.' }])
    } catch {
      setAiChat(p => [...p, { from:'ai', text:'I can help you analyze your clinic performance, review campaign results, and suggest improvements for patient engagement.' }])
    }
    setAiLoading(false)
  }

  const logout = () => {
    localStorage.removeItem('hayyamed_auth')
    window.location.href = '/login'
  }

  const orgName = auth.userName || 'Elite Medical Center'

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', minHeight:'100vh', fontFamily:'Inter, sans-serif'}}>

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div style={{background:'#0c0f1a', borderBottom:'1px solid #1e2d42', padding:'0 24px', height:'56px', display:'flex', alignItems:'center', gap:'14px', position:'sticky', top:0, zIndex:50}}>
        <div style={{fontWeight:'900', fontSize:'17px', letterSpacing:'-0.5px'}}>Hayya<span style={{color:'#D8B16A'}}> AI</span></div>
        <div style={{fontSize:'11px', color:'#3d4f63'}}>/ Client Portal</div>
        <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:'12px'}}>
          <div style={{fontSize:'12px', color:'#7a8fa6'}}>
            Welcome, <strong style={{color:'#e2e8f0'}}>{orgName}</strong>
          </div>
          <div style={{width:'1px', height:'20px', background:'#1e2d42'}}></div>
          <button onClick={logout}
            style={{background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', borderRadius:'6px', color:'#ef4444', fontSize:'11px', fontWeight:'700', padding:'5px 12px', cursor:'pointer'}}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{maxWidth:'1200px', margin:'0 auto', padding:'28px 24px'}}>

        {/* ── Welcome ──────────────────────────────────────────────────────── */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px'}}>
          <div>
            <div style={{fontSize:'26px', fontWeight:'900', marginBottom:'6px'}}>
              🏥 {orgName}
            </div>
            <div style={{fontSize:'13px', color:'#7a8fa6', display:'flex', alignItems:'center', gap:'8px'}}>
              <span style={{width:'8px', height:'8px', borderRadius:'50%', background:'#D8B16A', display:'inline-block'}}></span>
              WhatsApp Connected · Enterprise Plan · AI Score: 94%
            </div>
          </div>
          <button onClick={() => setShowAiPanel(true)}
            style={{background:'linear-gradient(135deg,#D8B16A,#A07C3A)', border:'none', borderRadius:'10px', color:'#07090f', fontWeight:'800', fontSize:'13px', padding:'12px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px'}}>
            🤖 Ask AI Assistant
          </button>
        </div>

        {/* ── KPI cards ──────────────────────────────────────────────────── */}
        <div style={{display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'14px', marginBottom:'24px'}}>
          {[
            { label:'TOTAL CONTACTS',   value: stats ? stats.totalContacts?.toLocaleString() : '—', sub:'In your database', color:'#D8B16A', icon:'👥' },
            { label:'MESSAGES SENT',    value: stats ? stats.totalMessages?.toLocaleString() : '—', sub:'All time',         color:'#3b82f6', icon:'💬' },
            { label:'ACTIVE CAMPAIGNS', value: stats ? stats.activeCampaigns ?? '—' : '—',          sub:'Currently running',color:'#a78bfa', icon:'📣' },
            { label:'WORKFLOWS',        value: stats ? stats.activeWorkflows ?? '—' : '—',           sub:'Automated flows',  color:'#f97316', icon:'⚡' },
          ].map(k => (
            <div key={k.label} style={{...card, borderTop:`2px solid ${k.color}`}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px'}}>
                <div style={{fontSize:'20px'}}>{k.icon}</div>
                <span style={{fontSize:'10px', padding:'2px 8px', borderRadius:'10px', background:k.color+'15', color:k.color, fontWeight:'700'}}>{k.trend}</span>
              </div>
              <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1.5px', marginBottom:'6px'}}>{k.label}</div>
              <div style={{fontSize:'26px', fontWeight:'900', color:k.color, marginBottom:'3px'}}>{k.value}</div>
              <div style={{fontSize:'11px', color:'#7a8fa6'}}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div style={{borderBottom:'1px solid #1e2d42', marginBottom:'24px', display:'flex', gap:'4px'}}>
          {[
            { id:'overview',   label:'Overview' },
            ...(can('view_inbox') ? [{ id:'fullinbox', label:'Inbox' }] : []),
            { id:'campaigns',  label:'Campaigns' },
            { id:'inbox',      label:'Recent Messages' },
            ...(can('manage_team') ? [{ id:'team', label:'Team' }] : []),
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{padding:'12px 18px', background:'none', border:'none', borderBottom: activeTab===t.id ? '2px solid #D8B16A' : '2px solid transparent', color: activeTab===t.id ? '#e2e8f0' : '#7a8fa6', fontSize:'13px', fontWeight: activeTab===t.id ? '700' : '400', cursor:'pointer', transition:'all .15s'}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB: OVERVIEW
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div style={{display:'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap:'20px'}}>

            {/* Weekly chart */}
            <div style={card}>
              <div style={{fontWeight:'800', fontSize:'14px', marginBottom:'4px'}}>Daily Messages — This Week</div>
              <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'20px'}}>Messages sent and received across all channels</div>
              {(() => {
                const days = analytics?.daily || []
                const vals = days.length > 0 ? days.map(d => d.messages || d.count || 0) : [0,0,0,0,0,0,0]
                const dayLabels = days.length > 0 ? days.map(d => {
                  const dt = new Date(d.date); return WEEK_DAYS[dt.getDay()]
                }) : WEEK_DAYS
                const mx = Math.max(...vals, 1)
                return (
                  <div style={{display:'flex', alignItems:'flex-end', gap:'10px', height:'130px'}}>
                    {vals.map((v, i) => (
                      <div key={i} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', height:'100%', justifyContent:'flex-end'}}>
                        {v > 0 && <div style={{fontSize:'10px', color:'#D8B16A', fontWeight:'700'}}>{v}</div>}
                        <div style={{width:'100%', background:'#D8B16A', borderRadius:'4px 4px 0 0', height:`${(v/mx)*100}%`, minHeight:'4px', opacity: i === vals.length-1 ? 1 : 0.55}}></div>
                        <div style={{fontSize:'10px', color:'#3d4f63'}}>{dayLabels[i]}</div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Right column */}
            <div style={{display:'flex', flexDirection:'column', gap:'14px'}}>

              {/* Subscription */}
              <div style={{...card, borderTop:'2px solid #a78bfa'}}>
                <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1.5px', marginBottom:'10px'}}>YOUR SUBSCRIPTION</div>
                <div style={{fontSize:'20px', fontWeight:'900', color:'#a78bfa', marginBottom:'4px'}}>Enterprise</div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'12px'}}>Unlimited messages · Unlimited contacts</div>
                <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                  {['Unlimited AI responses', 'Unlimited team members', 'Dedicated account manager', 'Priority support'].map(f => (
                    <div key={f} style={{fontSize:'11px', color:'#7a8fa6', display:'flex', alignItems:'center', gap:'7px'}}>
                      <span style={{color:'#a78bfa'}}>✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div style={card}>
                <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1.5px', marginBottom:'12px'}}>TODAY AT A GLANCE</div>
                {[
                  { label:'Messages today',     value: today ? String(today.messages ?? 0) : '—', color:'#D8B16A' },
                  { label:'New conversations',  value: today ? String(today.newConvs ?? 0) : '—', color:'#a78bfa' },
                  { label:'New leads',          value: today ? String(today.newLeads ?? 0) : '—', color:'#3b82f6' },
                  { label:'Appointments',       value: today ? String(today.bookings ?? 0) : '—', color:'#f97316' },
                ].map(s => (
                  <div key={s.label} style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                    <div style={{fontSize:'12px', color:'#7a8fa6'}}>{s.label}</div>
                    <div style={{fontSize:'14px', fontWeight:'900', color:s.color}}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: CAMPAIGNS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'campaigns' && (
          <div style={{display:'flex', flexDirection:'column', gap:'14px'}}>
            {loading ? (
              <div style={{...card, textAlign:'center', color:'#3d4f63', fontSize:'13px'}}>Loading campaigns…</div>
            ) : campaigns.length === 0 ? (
              <div style={{...card, textAlign:'center', color:'#3d4f63', fontSize:'13px'}}>No campaigns yet</div>
            ) : campaigns.map((c) => {
              const st = (c.status || 'DRAFT').toUpperCase()
              const stColor = st === 'RUNNING' ? '#D8B16A' : st === 'COMPLETED' ? '#3b82f6' : st === 'PAUSED' ? '#fbbf24' : '#64748b'
              return (
                <div key={c.id} style={{...card, display:'flex', alignItems:'center', gap:'20px'}}>
                  <div style={{width:'44px', height:'44px', borderRadius:'10px', background:stColor+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0}}>📣</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:'800', fontSize:'14px', marginBottom:'4px'}}>{c.name}</div>
                    <div style={{fontSize:'11px', color:'#7a8fa6'}}>{c.channel || c.channelType || 'WhatsApp'} · <span style={{color:stColor, fontWeight:'700'}}>{st}</span></div>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:'20px', textAlign:'center'}}>
                    {[
                      { label:'SENT',      value:(c.sentCount ?? c.sent ?? 0).toLocaleString(), color:'#e2e8f0' },
                      { label:'READ',      value:(c.readCount ?? 0).toLocaleString(),            color:'#3b82f6' },
                      { label:'RECIPIENTS',value:(c.totalRecipients ?? 0).toLocaleString(),      color:'#D8B16A' },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{fontSize:'17px', fontWeight:'900', color:s.color}}>{s.value}</div>
                        <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px'}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: INBOX
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'inbox' && (
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {loading ? (
              <div style={{...card, textAlign:'center', color:'#3d4f63', fontSize:'13px'}}>Loading conversations…</div>
            ) : convos.length === 0 ? (
              <div style={{...card, textAlign:'center', color:'#3d4f63', fontSize:'13px'}}>No conversations yet</div>
            ) : convos.map((c) => {
              const contactName = c.contact?.name || c.contact?.phone || 'Unknown'
              const initials = contactName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
              const status = c.contact?.status || 'NEW'
              const tagColor = STATUS_COLOR[status] || '#64748b'
              const tag = STATUS_TAG[status] || status
              return (
                <div key={c.id} style={{...card, display:'flex', alignItems:'center', gap:'16px', cursor:'pointer', transition:'border-color .15s'}}
                  onMouseEnter={e => e.currentTarget.style.borderColor='#2e4060'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='#1e2d42'}>
                  <div style={{width:'42px', height:'42px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', flexShrink:0, color:'#fff'}}>
                    {initials}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px'}}>
                      <div style={{fontWeight:'700', fontSize:'13px'}}>{contactName}</div>
                      <span style={{fontSize:'10px', padding:'2px 8px', borderRadius:'10px', background:tagColor+'18', color:tagColor, fontWeight:'700'}}>{tag}</span>
                      {!c.isRead && <span style={{width:'6px', height:'6px', background:'#D8B16A', borderRadius:'50%', display:'inline-block'}} />}
                    </div>
                    <div style={{fontSize:'12px', color:'#7a8fa6', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{c.lastMessage || 'No messages yet'}</div>
                  </div>
                  <div style={{textAlign:'right', flexShrink:0}}>
                    <div style={{fontSize:'11px', color:'#3d4f63'}}>{timeAgo(c.lastMsgAt || c.updatedAt)}</div>
                    <div style={{fontSize:'10px', color:'#3d4f63', marginTop:'2px'}}>{c.contact?.phone || ''}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ══════════ TAB: INBOX (functional chat) ══════════ */}
        {activeTab === 'fullinbox' && <ClientInbox me={me} />}

        {/* ══════════ TAB: TEAM ══════════ */}
        {activeTab === 'team' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'16px', flexWrap:'wrap', gap:'10px' }}>
              <div>
                <div style={{ fontSize:'18px', fontWeight:'800' }}>Team</div>
                <div style={{ fontSize:'12px', color:'#7a8fa6' }}>{team.length} of {me?.org?.maxSeats ?? 5} seats used · invite teammates and set their access</div>
              </div>
            </div>

            {teamMsg && <div style={{ marginBottom:'14px', padding:'10px 14px', borderRadius:'8px', fontSize:'12px', background: teamMsg.ok ? 'rgba(216,177,106,.1)' : 'rgba(239,68,68,.1)', border:`1px solid ${teamMsg.ok ? 'rgba(216,177,106,.3)' : 'rgba(239,68,68,.3)'}`, color: teamMsg.ok ? '#D8B16A' : '#ef4444' }}>{teamMsg.text}</div>}

            {/* Invite */}
            <div style={{ ...card, marginBottom:'16px' }}>
              <div style={{ fontWeight:'800', fontSize:'13px', marginBottom:'10px' }}>Invite a team member</div>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
                <input value={invite.email} onChange={e=>setInvite({ ...invite, email:e.target.value })} placeholder="email@business.com" style={{ flex:'1 1 200px', background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'8px', padding:'10px 12px', color:'#e8eef5', fontSize:'13px', outline:'none' }} />
                <input value={invite.name} onChange={e=>setInvite({ ...invite, name:e.target.value })} placeholder="Name (optional)" style={{ flex:'1 1 140px', background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'8px', padding:'10px 12px', color:'#e8eef5', fontSize:'13px', outline:'none' }} />
                <select value={invite.clientRole} onChange={e=>setInvite({ ...invite, clientRole:e.target.value })} style={{ background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'8px', padding:'10px 12px', color:'#e8eef5', fontSize:'13px', cursor:'pointer' }}>
                  {['manager','agent','viewer','billing','owner'].map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
                <button onClick={submitInvite} disabled={!invite.email.trim() || team.length >= (me?.org?.maxSeats ?? 5)} style={{ padding:'10px 18px', background: (invite.email.trim() && team.length < (me?.org?.maxSeats ?? 5)) ? '#D8B16A' : '#1a2235', border:'none', borderRadius:'8px', color:(invite.email.trim() && team.length < (me?.org?.maxSeats ?? 5)) ? '#07090f' : '#64748b', fontWeight:'800', fontSize:'13px', cursor:'pointer' }}>+ Invite</button>
              </div>
              {team.length >= (me?.org?.maxSeats ?? 5) && <div style={{ fontSize:'11px', color:'#fbbf24', marginTop:'8px' }}>Seat limit reached — ask your provider to add more seats.</div>}
            </div>

            {/* Members */}
            <div style={card}>
              {team.length === 0 ? <div style={{ fontSize:'13px', color:'#3d4f63', textAlign:'center', padding:'16px' }}>No team members yet.</div> : team.map(m => (
                <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 0', borderBottom:'1px solid #1a2235' }}>
                  <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'linear-gradient(135deg,#D8B16A,#A07C3A)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800', color:'#07090f', flexShrink:0 }}>{(m.name||m.email||'?')[0].toUpperCase()}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:'700', fontSize:'13px' }}>{m.name || m.email} {!m.isActive && <span style={{ fontSize:'10px', color:'#64748b' }}>· inactive</span>}</div>
                    <div style={{ fontSize:'11px', color:'#7a8fa6', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.email}</div>
                  </div>
                  <select value={m.clientRole} onChange={e=>setMemberRole(m, e.target.value)} disabled={m.id===me?.id} style={{ background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'7px', padding:'6px 8px', color:'#e8eef5', fontSize:'11px', cursor: m.id===me?.id?'not-allowed':'pointer' }}>
                    {['owner','manager','agent','viewer','billing'].map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                  <button onClick={()=>setMemberActive(m, !m.isActive)} disabled={m.id===me?.id} title={m.isActive?'Deactivate':'Activate'} style={{ fontSize:'11px', background:'none', border:'1px solid #1e2d42', borderRadius:'6px', padding:'5px 9px', color: m.isActive?'#fbbf24':'#16a34a', cursor: m.id===me?.id?'not-allowed':'pointer' }}>{m.isActive?'Pause':'Activate'}</button>
                  <button onClick={()=>removeMember(m)} disabled={m.id===me?.id} style={{ fontSize:'11px', background:'none', border:'none', color: m.id===me?.id?'#3d4f63':'#ef4444', cursor: m.id===me?.id?'not-allowed':'pointer' }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── AI Chat Panel ──────────────────────────────────────────────────── */}
      {showAiPanel && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
          <div style={{background:'#0f1520', border:'1px solid #1e2d42', borderRadius:'14px', width:'520px', height:'560px', display:'flex', flexDirection:'column', boxShadow:'0 24px 80px rgba(0,0,0,.6)'}}>
            <div style={{padding:'20px 24px', borderBottom:'1px solid #1e2d42', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div style={{fontWeight:'800', fontSize:'15px'}}>🤖 AI Assistant</div>
                <div style={{fontSize:'11px', color:'#7a8fa6', marginTop:'2px'}}>Ask about your clinic performance</div>
              </div>
              <button onClick={() => setShowAiPanel(false)} style={{background:'none', border:'none', color:'#7a8fa6', fontSize:'20px', cursor:'pointer', lineHeight:1}}>✕</button>
            </div>
            <div style={{flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'12px'}}>
              {aiChat.map((m, i) => (
                <div key={i} style={{display:'flex', justifyContent: m.from==='user' ? 'flex-end' : 'flex-start'}}>
                  <div style={{maxWidth:'80%', padding:'10px 14px', borderRadius: m.from==='user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.from==='user' ? 'linear-gradient(135deg,#D8B16A,#A07C3A)' : '#111622', color: m.from==='user' ? '#07090f' : '#e2e8f0', fontSize:'12px', lineHeight:'1.5', border: m.from==='ai' ? '1px solid #1e2d42' : 'none'}}>
                    {m.text}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div style={{display:'flex', justifyContent:'flex-start'}}>
                  <div style={{padding:'10px 14px', borderRadius:'12px 12px 12px 2px', background:'#111622', border:'1px solid #1e2d42', fontSize:'12px', color:'#7a8fa6'}}>Thinking…</div>
                </div>
              )}
            </div>
            <div style={{padding:'16px', borderTop:'1px solid #1e2d42', display:'flex', gap:'10px'}}>
              <input value={aiMsg} onChange={e => setAiMsg(e.target.value)} onKeyDown={e => e.key==='Enter' && !aiLoading && sendAiMsg()}
                placeholder="Ask about your performance, campaigns, leads…"
                style={{flex:1, background:'#111622', border:'1px solid #1e2d42', borderRadius:'8px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}/>
              <button onClick={sendAiMsg} disabled={aiLoading}
                style={{background: aiLoading ? '#1a2235' : 'linear-gradient(135deg,#D8B16A,#A07C3A)', border:'none', borderRadius:'8px', color: aiLoading ? '#7a8fa6' : '#07090f', fontWeight:'800', fontSize:'12px', padding:'10px 18px', cursor: aiLoading ? 'not-allowed' : 'pointer'}}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
