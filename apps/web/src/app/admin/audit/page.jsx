'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const CATEGORY_COLOR = {
  auth: '#3b82f6', user: '#a78bfa', contact: '#D8B16A', conversation: '#06b6d4',
  campaign: '#f59e0b', workflow: '#f97316', ai: '#8b5cf6', billing: '#fbbf24',
  admin: '#ef4444', security: '#dc2626', api: '#64748b', other: '#374151',
}
const CATEGORY_ICON = {
  auth: '🔐', user: '👤', contact: '👥', conversation: '💬', campaign: '📣',
  workflow: '⚡', ai: '🤖', billing: '💳', admin: '👑', security: '🛡️', api: '🔌', other: '⚙️',
}

function categorize(action) {
  const prefix = action?.split('.')?.[0] || 'other'
  return CATEGORY_COLOR[prefix] ? prefix : 'other'
}

function ActionBadge({ action }) {
  const cat = categorize(action)
  return (
    <span style={{
      fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: '600',
      background: CATEGORY_COLOR[cat] + '22', color: CATEGORY_COLOR[cat],
    }}>{action}</span>
  )
}

export default function AuditDashboardPage() {
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [orgFilter, setOrgFilter] = useState('')
  const [days, setDays] = useState(30)
  const [view, setView] = useState('logs') // logs | stats

  const loadStats = () => {
    api.getAuditStats(days).then(setStats).catch(() => {})
  }

  const loadLogs = () => {
    setLoading(true)
    api.getPlatformAuditLogs({ action: search || undefined, orgId: orgFilter || undefined, page, limit: 50 })
      .then(r => { setLogs(r.data || []); setTotal(r.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadStats() }, [days])
  useEffect(() => { loadLogs() }, [page, search, orgFilter])

  const pages = Math.ceil(total / 50)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <NavSidebar />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <span style={{ fontSize: '28px' }}>📋</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Audit Dashboard</h1>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#ef444422', color: '#ef4444', fontWeight: '700', border: '1px solid #ef444433' }}>
                Append-Only · 7yr Retention
              </span>
            </div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
              Complete audit trail — user actions, admin actions, AI calls, billing events, security alerts.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)} style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                background: days === d ? '#D8B16A' : '#1a2235', color: days === d ? '#0a0f1a' : '#94a3b8',
              }}>{d}d</button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Events', value: stats.total?.toLocaleString(), color: '#e2e8f0' },
              { label: 'Active Orgs', value: stats.activeOrgs, color: '#D8B16A' },
              { label: 'Active Users', value: stats.activeUsers, color: '#3b82f6' },
              { label: '🛡️ Security Events', value: stats.recentSecurityEvents?.length, color: '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '16px 20px', flex: 1, minWidth: '140px' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.value ?? '—'}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* View toggle + filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[{ id: 'logs', label: '📋 Log Stream' }, { id: 'stats', label: '📊 Analytics' }].map(v => (
              <button key={v.id} onClick={() => setView(v.id)} style={{
                padding: '7px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                background: view === v.id ? '#D8B16A' : '#1a2235', color: view === v.id ? '#0a0f1a' : '#94a3b8',
              }}>{v.label}</button>
            ))}
          </div>
          {view === 'logs' && (
            <>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Filter by action (e.g. auth.login)..."
                style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', padding: '8px 12px', color: '#e2e8f0', fontSize: '13px', width: '240px' }} />
              <input value={orgFilter} onChange={e => { setOrgFilter(e.target.value); setPage(1) }}
                placeholder="Filter by org ID..."
                style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', padding: '8px 12px', color: '#e2e8f0', fontSize: '13px', width: '200px' }} />
            </>
          )}
        </div>

        {view === 'stats' && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* By Category */}
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid #1a2235', fontWeight: '700', fontSize: '14px' }}>Events by Category</div>
              {(stats.byCategory || []).map((c, i) => {
                const maxCount = Math.max(...stats.byCategory.map(x => x.count))
                const pct = maxCount > 0 ? (c.count / maxCount) * 100 : 0
                const cat = c.category
                return (
                  <div key={cat} style={{ padding: '12px 18px', borderBottom: i < stats.byCategory.length - 1 ? '1px solid #0f1624' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px' }}>{CATEGORY_ICON[cat] || '⚙️'} {cat}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: CATEGORY_COLOR[cat] || '#94a3b8' }}>{c.count.toLocaleString()}</span>
                    </div>
                    <div style={{ height: '5px', background: '#1a2235', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: CATEGORY_COLOR[cat] || '#64748b', borderRadius: '3px' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Daily trend */}
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px' }}>Daily Event Volume</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
                {(stats.dailyTrend || []).map((d, i) => {
                  const maxCount = Math.max(...stats.dailyTrend.map(x => x.count))
                  const h = maxCount > 0 ? Math.max(4, (d.count / maxCount) * 100) : 4
                  return (
                    <div key={i} title={`${d.date}: ${d.count} events`}
                      style={{ flex: 1, height: `${h}px`, background: '#3b82f6', borderRadius: '2px 2px 0 0', opacity: 0.8 }} />
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                <span>{stats.dailyTrend?.[0]?.date}</span>
                <span>{stats.dailyTrend?.at(-1)?.date}</span>
              </div>

              {/* Security events */}
              {stats.recentSecurityEvents?.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444', marginBottom: '10px' }}>🛡️ Recent Security Events</div>
                  {stats.recentSecurityEvents.slice(0, 5).map((e, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: i < 4 ? '1px solid #1a2235' : 'none', display: 'flex', gap: '10px' }}>
                      <ActionBadge action={e.action} />
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(e.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Actions */}
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', overflow: 'hidden', gridColumn: '1 / -1' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid #1a2235', fontWeight: '700', fontSize: '14px' }}>Top Actions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '16px 18px' }}>
                {(stats.topActions || []).map(a => (
                  <div key={a.action} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0a0f1a', borderRadius: '6px', padding: '6px 12px' }}>
                    <ActionBadge action={a.action} />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0' }}>{a.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'logs' && (
          <>
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading audit logs...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1a2235' }}>
                        {['Time', 'Action', 'User', 'Org', 'Resource', 'ID'].map(h => (
                          <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No audit events yet. Events are recorded as users interact with the platform.</td></tr>
                      ) : logs.map((log, i) => (
                        <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? '1px solid #0f1624' : 'none' }}>
                          <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 14px' }}><ActionBadge action={log.action} /></td>
                          <td style={{ padding: '10px 14px', color: '#94a3b8' }}>
                            {log.userName || log.userEmail || <span style={{ color: '#374151' }}>system</span>}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#64748b' }}>{log.orgName || log.orgId?.slice(0, 8)}</td>
                          <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{log.resource}</td>
                          <td style={{ padding: '10px 14px', color: '#374151', fontFamily: 'monospace', fontSize: '11px' }}>
                            {log.resourceId?.slice(0, 12)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer', background: '#1a2235', color: page === 1 ? '#374151' : '#94a3b8', fontSize: '13px' }}>
                  ← Prev
                </button>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Page {page} of {pages} · {total.toLocaleString()} events</span>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: page === pages ? 'not-allowed' : 'pointer', background: '#1a2235', color: page === pages ? '#374151' : '#94a3b8', fontSize: '13px' }}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
