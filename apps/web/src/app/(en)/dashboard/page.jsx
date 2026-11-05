'use client'
import NavSidebar from '@/components/NavSidebar'
import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import { getAuth, ROLE_LABELS, logout } from '@/lib/auth'
import { useIsMobile } from '@/lib/useIsMobile'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'

const fmt = (n) => n == null ? '—' : n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n)
const fmtQar = (n) => (n || 0).toLocaleString('en-QA', { style: 'currency', currency: 'QAR', minimumFractionDigits: 0 })

const STAGE_COLOR = { NEW:'#64748b', CONTACTED:'#3b82f6', QUALIFYING:'#f97316', QUALIFIED:'#D8B16A', PROPOSAL:'#8b5cf6', NEGOTIATION:'#fbbf24', WON:'#22c55e', LOST:'#ef4444' }
const SOURCE_META = { whatsapp:{label:'WhatsApp',icon:'💬',color:'#25D366'}, website:{label:'Website',icon:'🌐',color:'#3b82f6'}, webchat:{label:'Website',icon:'🌐',color:'#3b82f6'}, live_chat:{label:'Website',icon:'🌐',color:'#3b82f6'}, instagram:{label:'Instagram',icon:'📸',color:'#a78bfa'}, facebook:{label:'Facebook',icon:'👤',color:'#3b82f6'}, messenger:{label:'Messenger',icon:'👤',color:'#3b82f6'}, telegram:{label:'Telegram',icon:'✈️',color:'#06b6d4'}, email:{label:'Email',icon:'📧',color:'#fbbf24'}, import:{label:'Import',icon:'📥',color:'#64748b'}, manual:{label:'Manual',icon:'✍️',color:'#64748b'}, referral:{label:'Referral',icon:'🤝',color:'#16a34a'} }
const srcMeta = (s) => SOURCE_META[String(s||'').toLowerCase()] || { label: s || 'Other', icon:'•', color:'#64748b' }
const ACTIVITY_LABEL = { note_added:'Added note', status_changed:'Status changed', contact_created:'Contact created', message_sent:'Message sent', campaign_sent:'Campaign sent', workflow_triggered:'Workflow triggered' }
const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0

function MiniAreaChart({ data, color = '#D8B16A', keyName = 'messages', height = 64 }) {
  const W = 400; const H = height
  const n = data.length
  if (n < 2) return <div style={{ height }} />
  const vals = data.map(d => d[keyName] || 0)
  const max = Math.max(...vals, 1)
  const pts = vals.map((v, i) => {
    const x = (i / (n - 1)) * W
    const y = H - (v / max) * H * 0.85 - 4
    return [x, y]
  })
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
  const area = line + ` L${pts[n-1][0]},${H} L0,${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`mg-${keyName}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#mg-${keyName})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

function QuickAction({ href, icon, label, color }) {
  return (
    <a href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '14px 8px', background: '#111622', border: `1px solid ${color}33`, borderRadius: '10px', textDecoration: 'none', transition: 'all .15s', minWidth: '90px', flex: 1 }}
      onMouseEnter={e => { e.currentTarget.style.background = color + '12'; e.currentTarget.style.borderColor = color + '55' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#111622'; e.currentTarget.style.borderColor = color + '33' }}>
      <span style={{ fontSize: '22px' }}>{icon}</span>
      <span style={{ fontSize: '11px', fontWeight: '700', color, textAlign: 'center' }}>{label}</span>
    </a>
  )
}

export default function Dashboard() {
  const isMobile = useIsMobile()
  const [full, setFull] = useState(null)
  const [chart, setChart] = useState([])
  const [loading, setLoading] = useState(true)
  const [auth, setAuth] = useState({})
  const [onboarding, setOnboarding] = useState(null)
  const [todayStats, setTodayStats] = useState(null)

  useEffect(() => {
    setAuth(getAuth())
    Promise.all([
      api.getFullStats().catch(() => null),
      api.getAnalytics('7days').catch(() => ({ days: [] })),
    ]).then(([f, c]) => {
      setFull(f)
      setChart(c?.days || [])
      setLoading(false)
    })
    api.getOnboarding().then(setOnboarding).catch(() => {})
    api.getToday().then(setTodayStats).catch(() => {})
  }, [])

  const kpis = full?.kpis
  const pipeline = full?.pipeline || []
  const campaigns = full?.campaigns || []
  const activities = full?.recentActivities || []
  const sources = full?.sources || []
  const leadStats = full?.leadStats || {}
  const sourceTotal = sources.reduce((a, s) => a + (s.count || 0), 0) || 1
  const sourceMax = Math.max(...sources.map(s => s.count || 0), 1)

  const userName = auth.userName || auth.name || 'Abbas'
  const firstName = userName.split(' ')[0]
  const roleInfo = ROLE_LABELS[auth.role || 'owner'] || ROLE_LABELS.owner

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  // Chart data — combine messages + contacts on same sparklines
  const chartMsgMax = Math.max(...chart.map(d => d.messages || 0), 1)
  const chartConMax = Math.max(...chart.map(d => d.contacts || 0), 1)

  // Pipeline max count for funnel bar widths
  const pipelineMax = Math.max(...pipeline.map(s => s.count), 1)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0', fontFamily: 'system-ui,sans-serif' }}>
      <NavSidebar current="dashboard" />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <div style={{ height: '50px', background: '#0c0f1a', borderBottom: '1px solid #1a2235', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '10px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ fontWeight: '800', fontSize: '15px' }}>Hayya<span style={{ color: '#D8B16A' }}> AI</span></div>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '10px', padding: '3px 9px', background: roleInfo.color + '18', border: `1px solid ${roleInfo.color}44`, borderRadius: '12px', color: roleInfo.color, fontWeight: '700' }}>{roleInfo.label}</span>
          <div style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '10px', background: 'rgba(216,177,106,.1)', border: '1px solid rgba(216,177,106,.2)', color: '#D8B16A', fontWeight: '700' }}>● LIVE</div>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `linear-gradient(135deg, ${roleInfo.color}, ${roleInfo.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#0a0f1a', cursor: 'pointer' }}
            onClick={logout}>
            {firstName[0]}{(userName.split(' ')[1] || '')[0] || ''}
          </div>
        </div>

        <div style={{ padding: isMobile ? '14px 14px' : '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>

          {/* Greeting + quick actions */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>{greeting}, {firstName} 👋</h1>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>{today} · Here's your CRM overview</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <QuickAction href="/contacts?action=new" icon="➕" label="New Contact" color="#D8B16A" />
              <QuickAction href="/campaigns" icon="📣" label="New Campaign" color="#3b82f6" />
              <QuickAction href="/pipeline" icon="📊" label="Pipeline" color="#8b5cf6" />
              <QuickAction href="/inbox" icon="💬" label="Inbox" color="#f97316" />
              <QuickAction href="/analytics" icon="📈" label="Analytics" color="#fbbf24" />
            </div>
          </div>

          {/* Today's pulse */}
          {todayStats && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '10px', padding: '12px 16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>Today</span>
              {[
                { icon: '🌱', label: 'leads', value: todayStats.newLeads, color: '#D8B16A' },
                { icon: '💬', label: 'conversations', value: todayStats.newConvs, color: '#3b82f6' },
                { icon: '✉️', label: 'messages', value: todayStats.messages, color: '#a78bfa' },
                { icon: '📅', label: 'bookings', value: todayStats.bookings, color: '#fbbf24' },
              ].map(s => (
                <span key={s.label} style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  {s.icon} <strong style={{ color: s.color, fontWeight: 800 }}>{s.value}</strong> {s.label}
                </span>
              ))}
              {todayStats.needsAttention > 0 && (
                <a href="/inbox" style={{ fontSize: '13px', color: '#ef4444', textDecoration: 'none', marginLeft: 'auto', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', padding: '3px 10px', fontWeight: 700 }}>
                  ⚠ {todayStats.needsAttention} need{todayStats.needsAttention === 1 ? 's' : ''} attention →
                </a>
              )}
            </div>
          )}

          {/* Getting Started checklist — shows until the workspace is set up */}
          {onboarding && !(onboarding.hasKnowledge && onboarding.hasAgent && onboarding.hasChannel && onboarding.hasConversation) && (
            <div style={{ background: 'linear-gradient(135deg, rgba(216,177,106,.08), rgba(167,139,250,.06))', border: '1px solid rgba(216,177,106,.25)', borderRadius: '12px', padding: '18px 20px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '3px' }}>🚀 Get your AI live</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>Complete these steps to start handling customer conversations automatically.</div>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px' }}>
                {[
                  { done: onboarding.hasKnowledge, label: 'Add your business info', sub: 'Knowledge base', href: '/knowledge' },
                  { done: onboarding.hasAgent, label: 'Create an AI agent', sub: 'Pick a role', href: '/agents' },
                  { done: onboarding.hasChannel, label: 'Connect a channel', sub: 'WhatsApp · Telegram · Web', href: '/integrations' },
                  { done: onboarding.hasConversation, label: 'Get a conversation', sub: 'Test it live', href: '/inbox' },
                ].map((s, i) => (
                  <a key={i} href={s.href} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: s.done ? 'rgba(216,177,106,.06)' : '#111622', border: `1px solid ${s.done ? 'rgba(216,177,106,.3)' : '#1a2235'}`, borderRadius: '10px', textDecoration: 'none' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, background: s.done ? '#D8B16A' : '#1a2235', color: s.done ? '#07090f' : '#64748b' }}>{s.done ? '✓' : i + 1}</div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: s.done ? '#94a3b8' : '#e2e8f0' }}>{s.label}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{s.sub}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* KPI Strip */}
          <div className="hai-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Total Contacts',   value: fmt(kpis?.totalContacts),   sub: `+${kpis?.newContacts7d || 0} this week`,    color: '#D8B16A', chart: chart, chartKey: 'contacts' },
              { label: 'Pipeline Value',   value: fmtQar(kpis?.pipelineValue), sub: `${fmtQar(kpis?.wonValue)} won`,            color: '#3b82f6', chart: null },
              { label: 'Win Rate',         value: `${kpis?.winRate ?? '—'}%`,  sub: `${kpis?.wonContacts || 0} deals closed`,   color: '#22c55e', chart: null },
              { label: 'Open Convs',       value: fmt(kpis?.openConvs),        sub: `${fmt(kpis?.totalConvs)} total`,           color: '#f97316', chart: null },
              { label: 'Active Campaigns', value: fmt(kpis?.activeCampaigns),  sub: `${kpis?.totalCampaigns || 0} total`,       color: '#8b5cf6', chart: null },
              { label: 'Workflow Runs',    value: fmt(kpis?.totalWorkflowRuns), sub: 'all time',                                color: '#06b6d4', chart: null },
              { label: 'Satisfaction',     value: kpis?.csatAvg != null ? `⭐ ${kpis.csatAvg}` : '—', sub: `${kpis?.csatCount || 0} rating${kpis?.csatCount === 1 ? '' : 's'}`, color: '#fbbf24', chart: null },
              { label: 'Avg Response',     value: kpis?.avgResponseMin != null ? (kpis.avgResponseMin < 60 ? `${kpis.avgResponseMin}m` : `${Math.round(kpis.avgResponseMin/60*10)/10}h`) : '—', sub: 'human first reply', color: '#ec4899', chart: null },
            ].map((k, i) => (
              <div key={i} style={{ background: '#111622', border: '1px solid #1a2235', borderTop: `2px solid ${k.color}`, borderRadius: '8px', padding: '14px 16px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ fontSize: '10px', color: '#475569', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '5px' }}>{k.label}</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: k.color }}>{loading ? <Skeleton width={52} height={20} /> : k.value}</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>{k.sub}</div>
                {k.chart && k.chart.length > 2 && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.5 }}>
                    <MiniAreaChart data={k.chart} color={k.color} keyName={k.chartKey} height={36} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chart + Pipeline funnel */}
          <div className="hai-rise" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '16px' }}>

            {/* Leads by Source + response/assignment */}
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>Leads by Source</div>
                <a href="/contacts" style={{ fontSize: '11px', color: '#D8B16A', textDecoration: 'none' }}>View leads →</a>
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[0,1,2,3].map(i => <Skeleton key={i} height={22} />)}
                </div>
              ) : sources.length === 0 ? (
                <EmptyState compact icon="📡" title="No leads yet" hint="Leads appear here as they arrive from your channels (WhatsApp, website, Instagram…)." action={{ href: '/contacts', label: 'Add a lead' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                  {sources.map(s => {
                    const m = srcMeta(s.source)
                    const pct = Math.round((s.count / sourceMax) * 100)
                    const share = Math.round((s.count / sourceTotal) * 100)
                    return (
                      <div key={s.source}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '4px' }}>
                          <span style={{ color: '#e2e8f0' }}>{m.icon} {m.label}</span>
                          <span style={{ color: '#94a3b8', fontWeight: 700 }}>{s.count} <span style={{ color: '#475569', fontWeight: 400 }}>({share}%)</span></span>
                        </div>
                        <div style={{ height: '8px', background: '#0a0f1a', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: m.color, borderRadius: '4px', transition: 'width .4s' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Response + assignment */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #1a2235' }}>
                {[
                  { label: 'Awaiting reply', value: leadStats.openConvs ?? 0, color: '#f97316' },
                  { label: 'Assigned', value: leadStats.assignedOpen ?? 0, color: '#D8B16A' },
                  { label: 'Unassigned', value: leadStats.unassignedOpen ?? 0, color: '#ef4444' },
                ].map(x => (
                  <div key={x.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '19px', fontWeight: 800, color: x.color }}>{loading ? <Skeleton width={28} height={19} /> : x.value}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>{x.label}</div>
                  </div>
                ))}
              </div>
              {leadStats.avgResponseMin != null && !loading && (
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', marginTop: '10px' }}>
                  Avg. first response: <span style={{ color: '#D8B16A', fontWeight: 700 }}>{leadStats.avgResponseMin < 60 ? `${leadStats.avgResponseMin}m` : `${Math.round(leadStats.avgResponseMin/60*10)/10}h`}</span>
                </div>
              )}
            </div>

            {/* Pipeline Funnel */}
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>Leads by Stage</div>
                <a href="/pipeline" style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none' }}>Open →</a>
              </div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[0,1,2,3].map(i => <Skeleton key={i} width="100%" height={22} />)}
                </div>
              ) : pipeline.every(s => s.count === 0) ? (
                <EmptyState compact icon="📊" title="No deals yet" hint="Add your first contacts to start tracking your pipeline." action={{ href: '/contacts', label: 'Add contacts' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {pipeline.filter(s => s.count > 0).map(s => {
                    const color = STAGE_COLOR[s.status] || '#64748b'
                    const w = pct(s.count, pipelineMax)
                    return (
                      <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '68px', fontSize: '10px', color: '#64748b', textAlign: 'right', flexShrink: 0 }}>{s.status}</div>
                        <div style={{ flex: 1, height: '16px', background: '#0a0f1a', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${w}%`, background: color, opacity: 0.8, borderRadius: '3px', transition: 'width .5s' }} />
                        </div>
                        <div style={{ width: '22px', fontSize: '11px', fontWeight: '800', color, textAlign: 'right', flexShrink: 0 }}>{s.count}</div>
                      </div>
                    )
                  })}
                  <div style={{ marginTop: '10px', padding: '10px', background: '#0a0f1a', borderRadius: '6px', border: '1px solid #1a2235' }}>
                    <div style={{ fontSize: '10px', color: '#475569' }}>Pipeline Value</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#3b82f6' }}>{fmtQar(kpis?.pipelineValue)}</div>
                    <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>{fmtQar(kpis?.wonValue)} won · {kpis?.winRate || 0}% win rate</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Campaigns + Activity Feed */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: '16px' }}>

            {/* Top Campaigns */}
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>Campaigns</div>
                <a href="/campaigns" style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none' }}>View all →</a>
              </div>
              {loading ? <div style={{ fontSize: '12px', color: '#475569' }}>Loading…</div>
                : campaigns.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#475569', padding: '16px 0' }}>
                    No campaigns yet. <a href="/campaigns" style={{ color: '#3b82f6' }}>Create one →</a>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1a2235' }}>
                        {['Name', 'Status', 'Sent', 'Read Rate'].map(h => (
                          <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: '#475569', fontSize: '10px', fontWeight: '600' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map(c => {
                        const readRate = pct(c.read, c.total)
                        const sc = c.status === 'COMPLETED' ? '#22c55e' : c.status === 'RUNNING' ? '#D8B16A' : '#64748b'
                        return (
                          <tr key={c.id} style={{ borderBottom: '1px solid #111622' }}>
                            <td style={{ padding: '9px 8px', color: '#e2e8f0', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '600' }}>{c.name}</td>
                            <td style={{ padding: '9px 8px' }}>
                              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: sc + '22', color: sc, fontWeight: '700' }}>{c.status}</span>
                            </td>
                            <td style={{ padding: '9px 8px', color: '#94a3b8' }}>{c.total}</td>
                            <td style={{ padding: '9px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '50px', height: '5px', background: '#1a2235', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${readRate}%`, background: readRate >= 40 ? '#22c55e' : readRate >= 20 ? '#fbbf24' : '#64748b', borderRadius: '3px' }} />
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: readRate >= 40 ? '#22c55e' : readRate >= 20 ? '#fbbf24' : '#64748b' }}>{readRate}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )
              }
            </div>

            {/* Recent Activity */}
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>Recent Activity</div>
                <a href="/analytics" style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none' }}>All →</a>
              </div>
              {loading ? <div style={{ fontSize: '12px', color: '#475569' }}>Loading…</div>
                : activities.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#475569' }}>No activity yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {activities.slice(0, 8).map((a, i) => (
                      <div key={a.id} style={{ display: 'flex', gap: '8px', padding: '7px 0', borderBottom: i < Math.min(activities.length, 8) - 1 ? '1px solid #1a2235' : 'none' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D8B16A', flexShrink: 0, marginTop: '5px' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ACTIVITY_LABEL[a.type] || a.type.replace(/_/g, ' ')}
                            {a.contactName && <> · <a href={a.contactId ? `/contacts/${a.contactId}` : '#'} style={{ color: '#3b82f6', textDecoration: 'none' }}>{a.contactName}</a></>}
                          </div>
                          <div style={{ fontSize: '10px', color: '#475569', marginTop: '1px' }}>
                            {a.userName && `${a.userName} · `}
                            {new Date(a.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>

          {/* Bottom nav shortcuts */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingBottom: '8px' }}>
            {[
              { href: '/contacts', label: 'Contacts', sub: fmt(kpis?.totalContacts) + ' total', color: '#D8B16A' },
              { href: '/inbox',    label: 'Inbox',    sub: fmt(kpis?.openConvs) + ' open',     color: '#f97316' },
              { href: '/workflows',label: 'Workflows', sub: fmt(kpis?.totalWorkflowRuns) + ' runs', color: '#06b6d4' },
              { href: '/campaigns',label: 'Campaigns', sub: fmt(kpis?.activeCampaigns) + ' active', color: '#8b5cf6' },
              { href: '/analytics',label: 'Analytics', sub: 'Full report', color: '#fbbf24' },
              { href: '/settings', label: 'Settings',  sub: 'Integrations', color: '#64748b' },
            ].map(s => (
              <a key={s.href} href={s.href} style={{ flex: 1, minWidth: '100px', padding: '12px 14px', background: '#111622', border: `1px solid ${s.color}22`, borderRadius: '8px', textDecoration: 'none', transition: 'border-color .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = s.color + '55'}
                onMouseLeave={e => e.currentTarget.style.borderColor = s.color + '22'}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: s.color }}>{s.label}</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{loading ? '—' : s.sub}</div>
              </a>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
