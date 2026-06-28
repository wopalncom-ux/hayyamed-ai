'use client'
import NavSidebar from '@/components/NavSidebar'
import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import { useIsMobile } from '@/lib/useIsMobile'

const fmt = (n) => n == null ? '—' : n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n)
const fmtQar = (n) => (n || 0).toLocaleString('en-QA', { style: 'currency', currency: 'QAR', minimumFractionDigits: 0 })
const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0

const STAGE_COLOR = {
  NEW: '#64748b', CONTACTED: '#3b82f6', QUALIFYING: '#f97316',
  QUALIFIED: '#D8B16A', PROPOSAL: '#8b5cf6', NEGOTIATION: '#fbbf24',
  WON: '#22c55e', LOST: '#ef4444',
}

const SOURCE_ICON = { whatsapp: '💬', instagram: '📸', web: '🌐', referral: '👥', manual: '✏️', import: '📊', email: '📧', facebook: '👤' }
const SOURCE_COLOR = { whatsapp: '#22c55e', instagram: '#f97316', web: '#3b82f6', referral: '#8b5cf6', manual: '#64748b', import: '#D8B16A', email: '#fbbf24', facebook: '#3b82f6' }

const ACTIVITY_LABELS = {
  note_added: 'Added a note',
  status_changed: 'Status changed',
  contact_created: 'Contact created',
  message_sent: 'Message sent',
  campaign_sent: 'Campaign message sent',
  workflow_triggered: 'Workflow triggered',
  workflow_completed: 'Workflow completed',
}

function SvgAreaChart({ data, metrics, height = 180 }) {
  const W = 800; const H = height
  const pad = { top: 10, bottom: 28, left: 4, right: 4 }
  const cw = W - pad.left - pad.right
  const ch = H - pad.top - pad.bottom
  const n = data.length
  if (n === 0) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '12px' }}>No data yet</div>

  const maxVal = Math.max(...data.flatMap(d => metrics.map(m => d[m.key] || 0)), 1)

  const points = (key) => data.map((d, i) => {
    const x = pad.left + (i / (n - 1 || 1)) * cw
    const y = pad.top + ch - ((d[key] || 0) / maxVal) * ch
    return `${x},${y}`
  }).join(' ')

  const area = (key) => {
    const pts = data.map((d, i) => {
      const x = pad.left + (i / (n - 1 || 1)) * cw
      const y = pad.top + ch - ((d[key] || 0) / maxVal) * ch
      return [x, y]
    })
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
    const areaD = pathD + ` L${pts[pts.length - 1][0]},${pad.top + ch} L${pts[0][0]},${pad.top + ch} Z`
    return areaD
  }

  const labels = data.map((d, i) => {
    const dt = new Date(d.date)
    const show = n <= 10 ? true : n <= 31 ? i % 3 === 0 : i % 7 === 0
    if (!show) return null
    const x = pad.left + (i / (n - 1 || 1)) * cw
    return { x, label: n <= 8 ? ['Su','Mo','Tu','We','Th','Fr','Sa'][dt.getUTCDay()] : d.date.slice(5) }
  }).filter(Boolean)

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => ({ v: Math.round(maxVal * (1 - t)), y: pad.top + ch * t }))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      {/* Grid lines */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={pad.left} x2={W - pad.right} y1={t.y} y2={t.y} stroke="#1a2235" strokeWidth="1" />
          <text x={pad.left + 2} y={t.y - 3} fontSize="9" fill="#475569">{fmt(t.v)}</text>
        </g>
      ))}
      {/* Area fills */}
      {metrics.map(m => (
        <defs key={`g-${m.key}`}>
          <linearGradient id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={m.color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={m.color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
      ))}
      {metrics.map(m => <path key={`a-${m.key}`} d={area(m.key)} fill={`url(#grad-${m.key})`} />)}
      {/* Lines */}
      {metrics.map(m => <polyline key={`l-${m.key}`} points={points(m.key)} fill="none" stroke={m.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />)}
      {/* X labels */}
      {labels.map((l, i) => (
        <text key={i} x={l.x} y={H - 4} fontSize="9" fill="#475569" textAnchor="middle">{l.label}</text>
      ))}
    </svg>
  )
}

function PipelineFunnel({ stages }) {
  const maxCount = Math.max(...stages.map(s => s.count), 1)
  const totalValue = stages.reduce((s, st) => s + st.value, 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {stages.map(s => {
        const barW = maxCount > 0 ? pct(s.count, maxCount) : 0
        const color = STAGE_COLOR[s.status] || '#64748b'
        return (
          <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '80px', fontSize: '10px', color: '#94a3b8', textAlign: 'right', flexShrink: 0 }}>{s.status}</div>
            <div style={{ flex: 1, height: '18px', background: '#111622', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: '100%', width: `${barW}%`, background: color, borderRadius: '3px', transition: 'width .5s', opacity: 0.85 }} />
            </div>
            <div style={{ width: '28px', fontSize: '11px', fontWeight: '700', color, flexShrink: 0 }}>{s.count}</div>
            {s.value > 0 && <div style={{ fontSize: '10px', color: '#64748b', flexShrink: 0, minWidth: '60px' }}>{fmtQar(s.value)}</div>}
          </div>
        )
      })}
    </div>
  )
}

function SourceBreakdown({ sources }) {
  const total = sources.reduce((s, x) => s + x.count, 0)
  const COLORS = ['#D8B16A', '#3b82f6', '#f97316', '#8b5cf6', '#fbbf24', '#ef4444', '#22c55e', '#06b6d4']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {sources.slice(0, 6).map((s, i) => {
        const color = SOURCE_COLOR[s.source] || COLORS[i % COLORS.length]
        const p = total > 0 ? Math.round((s.count / total) * 100) : 0
        return (
          <div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', width: '20px' }}>{SOURCE_ICON[s.source] || '🔗'}</span>
            <div style={{ width: '70px', fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' }}>{s.source}</div>
            <div style={{ flex: 1, height: '8px', background: '#111622', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${p}%`, background: color, borderRadius: '4px', transition: 'width .5s' }} />
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', color, width: '36px', textAlign: 'right' }}>{p}%</div>
            <div style={{ fontSize: '10px', color: '#475569', width: '24px', textAlign: 'right' }}>{s.count}</div>
          </div>
        )
      })}
      {sources.length === 0 && <div style={{ fontSize: '12px', color: '#475569' }}>No source data yet</div>}
    </div>
  )
}

function CampaignTable({ campaigns }) {
  if (campaigns.length === 0) return <div style={{ fontSize: '12px', color: '#475569', padding: '12px 0' }}>No campaigns run yet</div>
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #1a2235' }}>
          {['Campaign', 'Status', 'Sent', 'Delivered', 'Read', 'Read Rate'].map(h => (
            <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#475569', fontWeight: '600', fontSize: '10px' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {campaigns.map(c => {
          const delRate = pct(c.delivered, c.total)
          const readRate = pct(c.read, c.total)
          const statusColor = c.status === 'COMPLETED' ? '#22c55e' : c.status === 'RUNNING' ? '#D8B16A' : '#64748b'
          return (
            <tr key={c.id} style={{ borderBottom: '1px solid #111622' }}>
              <td style={{ padding: '8px', color: '#e2e8f0', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
              <td style={{ padding: '8px' }}>
                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: statusColor + '22', color: statusColor, fontWeight: '700' }}>{c.status}</span>
              </td>
              <td style={{ padding: '8px', color: '#94a3b8' }}>{c.total}</td>
              <td style={{ padding: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '40px', height: '4px', background: '#1a2235', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${delRate}%`, background: '#3b82f6' }} />
                  </div>
                  <span style={{ color: '#3b82f6' }}>{c.delivered}</span>
                </div>
              </td>
              <td style={{ padding: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '40px', height: '4px', background: '#1a2235', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${readRate}%`, background: '#D8B16A' }} />
                  </div>
                  <span style={{ color: '#D8B16A' }}>{c.read}</span>
                </div>
              </td>
              <td style={{ padding: '8px', fontWeight: '700', color: readRate >= 40 ? '#22c55e' : readRate >= 20 ? '#fbbf24' : '#64748b' }}>
                {readRate}%
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function ActivityFeed({ activities }) {
  if (activities.length === 0) return <div style={{ fontSize: '12px', color: '#475569' }}>No recent activity</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {activities.map((a, i) => (
        <div key={a.id} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: i < activities.length - 1 ? '1px solid #111622' : 'none' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D8B16A', flexShrink: 0, marginTop: '5px' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', color: '#e2e8f0' }}>
              {ACTIVITY_LABELS[a.type] || a.type.replace(/_/g, ' ')}
              {a.contactName && <> · <a href={a.contactId ? `/contacts/${a.contactId}` : '#'} style={{ color: '#3b82f6', textDecoration: 'none' }}>{a.contactName}</a></>}
            </div>
            <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
              {a.userName && <span>{a.userName} · </span>}
              {new Date(a.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const isMobile = useIsMobile()
  const [period, setPeriod] = useState('7days')
  const [metric, setMetric] = useState('both')
  const [full, setFull] = useState(null)
  const [chart, setChart] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)

  useEffect(() => {
    api.getFullStats().then(setFull).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setChartLoading(true)
    api.getAnalytics(period)
      .then(d => setChart(d.days || []))
      .catch(() => {})
      .finally(() => setChartLoading(false))
  }, [period])

  const kpis = full?.kpis
  const pipeline = full?.pipeline || []
  const sources = full?.sources || []
  const campaigns = full?.campaigns || []
  const recentActivities = full?.recentActivities || []

  const chartMetrics = useMemo(() => {
    if (metric === 'messages') return [{ key: 'messages', color: '#3b82f6', label: 'Messages' }]
    if (metric === 'contacts') return [{ key: 'contacts', color: '#D8B16A', label: 'Contacts' }]
    return [{ key: 'messages', color: '#3b82f6', label: 'Messages' }, { key: 'contacts', color: '#D8B16A', label: 'Contacts' }]
  }, [metric])

  const KPI_CARDS = [
    { label: 'Total Contacts', value: fmt(kpis?.totalContacts), sub: `+${kpis?.newContacts7d || 0} this week`, color: '#D8B16A' },
    { label: 'Pipeline Value', value: fmtQar(kpis?.pipelineValue), sub: `${fmtQar(kpis?.wonValue)} won`, color: '#3b82f6' },
    { label: 'Win Rate', value: `${kpis?.winRate ?? '—'}%`, sub: `${kpis?.wonContacts || 0} won`, color: '#8b5cf6' },
    { label: 'Open Conversations', value: fmt(kpis?.openConvs), sub: `${fmt(kpis?.totalConvs)} total`, color: '#f97316' },
    { label: 'Active Campaigns', value: fmt(kpis?.activeCampaigns), sub: `${kpis?.totalCampaigns || 0} total`, color: '#fbbf24' },
    { label: 'Workflow Runs', value: fmt(kpis?.totalWorkflowRuns), sub: 'all time', color: '#06b6d4' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0', fontFamily: 'system-ui,sans-serif' }}>
      <NavSidebar current="analytics" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Analytics</h1>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>Real-time data across contacts, campaigns, pipeline, and activity</div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['7days', '30days', '90days'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: '7px 13px', background: period === p ? '#D8B16A' : '#111622', border: `1px solid ${period === p ? '#D8B16A' : '#1a2235'}`, borderRadius: '6px', color: period === p ? '#0a0f1a' : '#64748b', fontSize: '12px', cursor: 'pointer', fontWeight: period === p ? '700' : '400' }}>
                {p === '7days' ? '7D' : p === '30days' ? '30D' : '90D'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {KPI_CARDS.map((k, i) => (
            <div key={i} style={{ background: '#111622', border: '1px solid #1a2235', borderTop: `2px solid ${k.color}`, borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '10px', color: '#475569', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>{k.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: k.color }}>{loading ? '—' : k.value}</div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Area chart */}
        <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontWeight: '700', fontSize: '14px' }}>Activity Over Time</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {/* Legend */}
              {[{ key: 'messages', color: '#3b82f6' }, { key: 'contacts', color: '#D8B16A' }].map(m => (
                <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                  <div style={{ width: '10px', height: '3px', background: m.color, borderRadius: '2px' }} />
                  {m.key}
                </div>
              ))}
              <div style={{ width: '1px', background: '#1a2235', margin: '0 4px' }} />
              {['both', 'messages', 'contacts'].map(m => (
                <button key={m} onClick={() => setMetric(m)}
                  style={{ padding: '4px 9px', background: metric === m ? '#1a2235' : 'transparent', border: `1px solid ${metric === m ? '#253045' : 'transparent'}`, borderRadius: '4px', color: metric === m ? '#e2e8f0' : '#475569', fontSize: '11px', cursor: 'pointer', textTransform: 'capitalize' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          {chartLoading
            ? <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '12px' }}>Loading…</div>
            : <SvgAreaChart data={chart} metrics={chartMetrics} height={180} />
          }
        </div>

        {/* Pipeline Funnel + Source Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
          <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '16px' }}>
              Pipeline Funnel
              <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: '400', color: '#64748b' }}>drag cards at /pipeline</span>
            </div>
            {loading
              ? <div style={{ fontSize: '12px', color: '#475569' }}>Loading…</div>
              : <PipelineFunnel stages={pipeline} />
            }
          </div>

          <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '16px' }}>Lead Sources</div>
            {loading
              ? <div style={{ fontSize: '12px', color: '#475569' }}>Loading…</div>
              : <SourceBreakdown sources={sources} />
            }
          </div>
        </div>

        {/* Campaign Table + Activity Feed */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: '16px' }}>
          <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontWeight: '700', fontSize: '14px' }}>Campaign Performance</div>
              <a href="/campaigns" style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none' }}>View all →</a>
            </div>
            {loading ? <div style={{ fontSize: '12px', color: '#475569' }}>Loading…</div> : <CampaignTable campaigns={campaigns} />}
          </div>

          <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '14px' }}>Recent Activity</div>
            {loading ? <div style={{ fontSize: '12px', color: '#475569' }}>Loading…</div> : <ActivityFeed activities={recentActivities} />}
          </div>
        </div>

      </div>
    </div>
  )
}
