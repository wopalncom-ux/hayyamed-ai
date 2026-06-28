'use client'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const STATUS = {
  operational:    { label: 'Operational',    color: '#D8B16A', dot: '#D8B16A' },
  not_configured: { label: 'Not configured', color: '#f59e0b', dot: '#f59e0b' },
  degraded:       { label: 'Degraded',       color: '#f59e0b', dot: '#f59e0b' },
  attention:      { label: 'Needs attention',color: '#f59e0b', dot: '#f59e0b' },
  down:           { label: 'Down',            color: '#ef4444', dot: '#ef4444' },
}

const ICONS = {
  'API Server': '🖥️', 'Database (PostgreSQL)': '🗄️', 'AI — OpenAI': '🤖', 'AI — Anthropic': '🧠',
  'AI — Gemini': '✨', 'AI — Groq': '⚡', 'Email (Postmark)': '📧', 'Payments (Stripe)': '💳',
  'WhatsApp Business': '💬', 'Storage': '📦', 'Backups': '💾',
}

export default function HealthMonitoring() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    setError('')
    try {
      const r = await api.getSystemHealth()
      setData(r)
    } catch (e) {
      setError(e?.message || 'Failed to load system health')
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(() => load(true), 30000) // auto-refresh every 30s
    return () => clearInterval(t)
  }, [load])

  const overall = data ? (STATUS[data.overall] || STATUS.attention) : null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <NavSidebar current="admin" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, letterSpacing: '0.08em' }}>MASTER CONTROL · OWNER ONLY</div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0' }}>System Health Monitoring</h1>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Live status of every platform service. Auto-refreshes every 30s.</p>
          </div>
          <button onClick={() => load(true)} disabled={refreshing}
            style={{ padding: '9px 18px', background: refreshing ? '#1a2235' : '#111622', border: '1px solid #1e2d42', borderRadius: '8px', color: '#e2e8f0', fontSize: '13px', fontWeight: 600, cursor: refreshing ? 'wait' : 'pointer' }}>
            {refreshing ? '⟳ Refreshing…' : '⟳ Refresh now'}
          </button>
        </div>

        {loading ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '60px', fontSize: '14px' }}>Checking all services…</div>
        ) : error ? (
          <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '10px', padding: '20px', color: '#ef4444', fontSize: '14px' }}>
            ⚠️ {error}
          </div>
        ) : data && (
          <>
            {/* Overall banner */}
            <div style={{ background: `${overall.color}10`, border: `1px solid ${overall.color}40`, borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: overall.dot, boxShadow: `0 0 12px ${overall.dot}`, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: overall.color }}>
                  {data.overall === 'operational' ? 'All core systems operational' : data.overall === 'degraded' ? 'System degraded — action needed' : 'Operational — some services need configuration'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {data.operational} of {data.total} services fully operational · checked {new Date(data.checkedAt).toLocaleTimeString()}
                </div>
              </div>
              <div style={{ fontSize: '30px', fontWeight: 900, color: overall.color }}>
                {Math.round((data.operational / data.total) * 100)}%
              </div>
            </div>

            {/* Service grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {data.services.map(s => {
                const st = STATUS[s.status] || STATUS.attention
                return (
                  <div key={s.name} style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>{ICONS[s.name] || '🔧'}</span>
                        <span style={{ fontWeight: 700, fontSize: '14px' }}>{s.name}</span>
                      </div>
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: st.dot, flexShrink: 0 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: st.color }}>{st.label}</span>
                      {typeof s.latencyMs === 'number' && s.latencyMs > 0 && (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{s.latencyMs}ms</span>
                      )}
                    </div>
                    {s.detail && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>{s.detail}</div>}
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: '20px', background: 'rgba(167,139,250,.04)', border: '1px solid rgba(167,139,250,.12)', borderRadius: '10px', padding: '14px 18px', fontSize: '12px', color: '#64748b', lineHeight: 1.7 }}>
              💡 Services marked <strong style={{ color: '#f59e0b' }}>Not configured</strong> are not broken — they just need real credentials in GCP Secret Manager (e.g. valid OpenAI/Anthropic keys, Postmark token, Stripe key) to go live.
            </div>
          </>
        )}
      </main>
    </div>
  )
}
