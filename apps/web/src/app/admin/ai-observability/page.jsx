'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const PROVIDER_COLOR = { openai: '#10a37f', anthropic: '#d97706', gemini: '#4285f4', groq: '#f97316' }
const PROVIDER_ICON = { openai: '🟢', anthropic: '🟠', gemini: '🔵', groq: '🔶' }
const MODULE_ICON = { chatbot: '💬', campaign: '📣', 'ai-agent': '🤖', knowledge: '🧠', reply: '↩️', score: '⭐', classify: '🏷️', translate: '🌐', insights: '💡' }

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '18px 20px', minWidth: '160px', flex: '1' }}>
      <div style={{ fontSize: '26px', fontWeight: '800', color: color || '#e2e8f0' }}>{value ?? '—'}</div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{label}</span>
        <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: '600' }}>{value}</span>
      </div>
      <div style={{ height: '6px', background: '#1a2235', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color || '#00e5a0', borderRadius: '3px', transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

export default function AIObservabilityPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  const load = () => {
    setLoading(true)
    api.getAIObservabilityStats(days)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [days])

  const s = data?.summary || {}
  const maxProviderCost = Math.max(...(data?.byProvider?.map(p => p.cost) || [0]))
  const maxModuleCalls = Math.max(...(data?.byModule?.map(m => m.calls) || [0]))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <NavSidebar />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <span style={{ fontSize: '28px' }}>🔭</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>AI Observability</h1>
            </div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
              Track every AI call — cost, latency, provider, and quality across all modules.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)} style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                background: days === d ? '#00e5a0' : '#1a2235', color: days === d ? '#0a0f1a' : '#94a3b8',
              }}>{d}d</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '60px 0' }}>Loading AI metrics...</div>
        ) : !data ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🤖</div>
            <div>No AI calls recorded yet.</div>
            <div style={{ fontSize: '12px', marginTop: '6px' }}>Start using AI features to see metrics here.</div>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <StatCard label="Total AI Calls" value={s.totalCalls?.toLocaleString()} color="#00e5a0" />
              <StatCard label="Total Cost" value={`$${s.totalCostUsd?.toFixed(4)}`} sub={`≈ $${((s.totalCostUsd || 0) * 12).toFixed(2)}/yr`} color="#fbbf24" />
              <StatCard label="Total Tokens" value={(s.totalTokens / 1000)?.toFixed(1) + 'K'} color="#a78bfa" />
              <StatCard label="Avg Latency" value={`${s.avgLatencyMs}ms`} color={s.avgLatencyMs > 3000 ? '#ef4444' : '#3b82f6'} />
              <StatCard label="Success Rate" value={`${s.successRate}%`} color={s.successRate >= 99 ? '#00e5a0' : '#f97316'} />
              <StatCard label="Escalation Rate" value={`${s.escalationRate}%`} color={s.escalationRate < 5 ? '#00e5a0' : '#ef4444'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>

              {/* By Provider */}
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '20px' }}>
                <div style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px' }}>Cost by Provider</div>
                {data.byProvider?.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: '13px' }}>No data</div>
                ) : data.byProvider?.map(p => (
                  <div key={p.provider} style={{ marginBottom: '14px' }}>
                    <MiniBar
                      label={`${PROVIDER_ICON[p.provider] || '⚡'} ${p.provider} (${p.calls} calls, ${p.avgLatency}ms avg)`}
                      value={`$${p.cost.toFixed(4)}`}
                      max={maxProviderCost}
                      color={PROVIDER_COLOR[p.provider] || '#00e5a0'}
                    />
                  </div>
                ))}
              </div>

              {/* By Module */}
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '20px' }}>
                <div style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px' }}>Calls by Module</div>
                {data.byModule?.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: '13px' }}>No data</div>
                ) : data.byModule?.map(m => (
                  <div key={m.module} style={{ marginBottom: '14px' }}>
                    <MiniBar
                      label={`${MODULE_ICON[m.module] || '⚙️'} ${m.module} (${m.escalations} escalations)`}
                      value={m.calls}
                      max={maxModuleCalls}
                      color="#a78bfa"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Trend */}
            {data.dailyTrend?.length > 0 && (
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px' }}>Daily Cost Trend</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px' }}>
                  {data.dailyTrend.map((d, i) => {
                    const maxCost = Math.max(...data.dailyTrend.map(x => x.cost))
                    const h = maxCost > 0 ? Math.max(4, (d.cost / maxCost) * 80) : 4
                    return (
                      <div key={i} title={`${d.date}: $${d.cost.toFixed(4)} (${d.calls} calls)`}
                        style={{ flex: 1, height: `${h}px`, background: '#00e5a0', borderRadius: '2px 2px 0 0', cursor: 'pointer', opacity: 0.8 }}
                      />
                    )
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                  <span>{data.dailyTrend[0]?.date}</span>
                  <span>{data.dailyTrend.at(-1)?.date}</span>
                </div>
              </div>
            )}

            {/* Recent Calls */}
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a2235', fontWeight: '700', fontSize: '14px' }}>
                Recent AI Calls
              </div>
              {data.recentCalls?.length === 0 ? (
                <div style={{ padding: '20px', color: '#64748b', fontSize: '13px' }}>No recent calls</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1a2235' }}>
                        {['Module', 'Action', 'Provider', 'Model', 'Tokens', 'Cost', 'Latency', 'Status', 'Time'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentCalls.map((c, i) => (
                        <tr key={c.id} style={{ borderBottom: i < data.recentCalls.length - 1 ? '1px solid #0f1624' : 'none' }}>
                          <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{MODULE_ICON[c.module] || '⚙️'} {c.module}</td>
                          <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{c.action}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ color: PROVIDER_COLOR[c.provider] || '#e2e8f0', fontWeight: '600' }}>{c.provider}</span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '11px' }}>{c.model}</td>
                          <td style={{ padding: '10px 14px', color: '#e2e8f0' }}>{Number(c.totalTokens).toLocaleString()}</td>
                          <td style={{ padding: '10px 14px', color: '#fbbf24' }}>${Number(c.costUsd).toFixed(5)}</td>
                          <td style={{ padding: '10px 14px', color: c.latencyMs > 3000 ? '#ef4444' : '#94a3b8' }}>{c.latencyMs}ms</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ color: c.success ? '#00e5a0' : '#ef4444', fontWeight: '700' }}>
                              {c.success ? '✓' : '✗'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '11px', whiteSpace: 'nowrap' }}>
                            {new Date(c.createdAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
