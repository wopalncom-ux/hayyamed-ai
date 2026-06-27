'use client'
import NavSidebar from '@/components/NavSidebar'
import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import { getAuth, ROLE_LABELS, logout } from '@/lib/auth'
import { useIsMobile } from '@/lib/useIsMobile'

const fmt = (n) => n == null ? '—' : n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n)
const fmtQar = (n) => (n || 0).toLocaleString('en-QA', { style: 'currency', currency: 'QAR', minimumFractionDigits: 0 })

const STAGE_COLOR = { NEW:'#64748b', CONTACTED:'#3b82f6', QUALIFYING:'#f97316', QUALIFIED:'#00e5a0', PROPOSAL:'#8b5cf6', NEGOTIATION:'#fbbf24', WON:'#22c55e', LOST:'#ef4444' }
const ACTIVITY_LABEL = { note_added:'Added note', status_changed:'Status changed', contact_created:'Contact created', message_sent:'Message sent', campaign_sent:'Campaign sent', workflow_triggered:'Workflow triggered' }
const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0

function MiniAreaChart({ data, color = '#00e5a0', keyName = 'messages', height = 64 }) {
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
  }, [])

  const kpis = full?.kpis
  const pipeline = full?.pipeline || []
  const campaigns = full?.campaigns || []
  const activities = full?.recentActivities || []

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
          <div style={{ fontWeight: '800', fontSize: '15px' }}>Hayya<span style={{ color: '#00e5a0' }}>med</span> AI</div>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '10px', padding: '3px 9px', background: roleInfo.color + '18', border: `1px solid ${roleInfo.color}44`, borderRadius: '12px', color: roleInfo.color, fontWeight: '700' }}>{roleInfo.label}</span>
          <div style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '10px', background: 'rgba(0,229,160,.1)', border: '1px solid rgba(0,229,160,.2)', color: '#00e5a0', fontWeight: '700' }}>● LIVE</div>
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
              <QuickAction href="/contacts?action=new" icon="➕" label="New Contact" color="#00e5a0" />
              <QuickAction href="/campaigns" icon="📣" label="New Campaign" color="#3b82f6" />
              <QuickAction href="/pipeline" icon="📊" label="Pipeline" color="#8b5cf6" />
              <QuickAction href="/inbox" icon="💬" label="Inbox" color="#f97316" />
              <QuickAction href="/analytics" icon="📈" label="Analytics" color="#fbbf24" />
            </div>
          </div>

          {/* KPI Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Total Contacts',   value: fmt(kpis?.totalContacts),   sub: `+${kpis?.newContacts7d || 0} this week`,    color: '#00e5a0', chart: chart, chartKey: 'contacts' },
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
                <div style={{ fontSize: '20px', fontWeight: '800', color: k.color }}>{loading ? '—' : k.value}</div>
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
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '16px' }}>

            {/* 7-day chart */}
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>Last 7 Days</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#64748b' }}>
                  <span><span style={{ display: 'inline-block', width: '10px', height: '3px', background: '#3b82f6', borderRadius: '2px', verticalAlign: 'middle', marginRight: '4px' }} />Messages</span>
                  <span><span style={{ display: 'inline-block', width: '10px', height: '3px', background: '#00e5a0', borderRadius: '2px', verticalAlign: 'middle', marginRight: '4px' }} />Contacts</span>
                </div>
              </div>
              {chart.length < 2 ? (
                <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '12px' }}>
                  {loading ? 'Loading…' : 'No activity data yet'}
                </div>
              ) : (
                <>
                  {/* Dual mini chart */}
                  <div style={{ position: 'relative', height: '120px' }}>
                    <svg viewBox={`0 0 700 120`} style={{ width: '100%', height: '120px' }} preserveAspectRatio="none">
                      {/* Grid */}
                      {[0, 0.33, 0.66, 1].map((t, i) => (
                        <line key={i} x1="0" x2="700" y1={t * 110 + 5} y2={t * 110 + 5} stroke="#1a2235" strokeWidth="1" />
                      ))}
                      {/* Messages area */}
                      {(() => {
                        const n = chart.length
                        const pts = chart.map((d, i) => {
                          const x = (i / (n - 1)) * 700
                          const y = 110 - ((d.messages || 0) / chartMsgMax) * 100 + 5
                          return [x, y]
                        })
                        const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
                        const area = line + ` L${pts[n-1][0]},115 L0,115 Z`
                        return (
                          <g key="msg">
                            <defs><linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></linearGradient></defs>
                            <path d={area} fill="url(#gm)" />
                            <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
                          </g>
                        )
                      })()}
                      {/* Contacts area */}
                      {(() => {
                        const n = chart.length
                        const pts = chart.map((d, i) => {
                          const x = (i / (n - 1)) * 700
                          const y = 110 - ((d.contacts || 0) / chartConMax) * 100 + 5
                          return [x, y]
                        })
                        const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
                        const area = line + ` L${pts[n-1][0]},115 L0,115 Z`
                        return (
                          <g key="con">
                            <defs><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00e5a0" stopOpacity="0.2" /><stop offset="100%" stopColor="#00e5a0" stopOpacity="0" /></linearGradient></defs>
                            <path d={area} fill="url(#gc)" />
                            <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke="#00e5a0" strokeWidth="2" strokeLinejoin="round" />
                          </g>
                        )
                      })()}
                      {/* X-axis labels */}
                      {chart.map((d, i) => {
                        const x = (i / (chart.length - 1)) * 700
                        const dt = new Date(d.date)
                        return <text key={i} x={x} y={120} fontSize="9" fill="#475569" textAnchor="middle">{['Su','Mo','Tu','We','Th','Fr','Sa'][dt.getUTCDay()]}</text>
                      })}
                    </svg>
                  </div>
                  {/* Day totals */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                    {chart.map((d, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#3b82f6', fontWeight: '700' }}>{d.messages || 0}</div>
                        <div style={{ fontSize: '9px', color: '#00e5a0' }}>{d.contacts || 0}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Pipeline Funnel */}
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>Pipeline</div>
                <a href="/pipeline" style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none' }}>Open →</a>
              </div>
              {loading ? (
                <div style={{ fontSize: '12px', color: '#475569' }}>Loading…</div>
              ) : pipeline.every(s => s.count === 0) ? (
                <div style={{ fontSize: '12px', color: '#475569', padding: '20px 0' }}>No contacts in pipeline yet.<br /><a href="/contacts" style={{ color: '#3b82f6' }}>Add contacts →</a></div>
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
                        const sc = c.status === 'COMPLETED' ? '#22c55e' : c.status === 'RUNNING' ? '#00e5a0' : '#64748b'
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
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e5a0', flexShrink: 0, marginTop: '5px' }} />
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
              { href: '/contacts', label: 'Contacts', sub: fmt(kpis?.totalContacts) + ' total', color: '#00e5a0' },
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
