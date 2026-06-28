'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const GRADE_COLOR = { A: '#D8B16A', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' }
const MODULE_ICON = { chatbot: '💬', campaign: '📣', 'ai-agent': '🤖', knowledge: '🧠', reply: '↩️', score: '⭐', classify: '🏷️', translate: '🌐', insights: '💡', ai: '⚙️' }

function GradeBadge({ grade }) {
  return (
    <div style={{
      width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: GRADE_COLOR[grade] + '22', border: `2px solid ${GRADE_COLOR[grade]}`,
      fontSize: '20px', fontWeight: '900', color: GRADE_COLOR[grade], flexShrink: 0,
    }}>{grade}</div>
  )
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '16px 18px', flex: 1, minWidth: '140px' }}>
      <div style={{ fontSize: '24px', fontWeight: '800', color: color || '#e2e8f0' }}>{value ?? '—'}</div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

export default function AIQualityPage() {
  const [data, setData] = useState(null)
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [view, setView] = useState('platform')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.getMasterAIQuality(days),
      api.getAllOrgAIQuality(days),
    ]).then(([platform, orgList]) => {
      setData(platform)
      setOrgs(Array.isArray(orgList) ? orgList : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [days])

  const p = data?.platform || {}

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <NavSidebar />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <span style={{ fontSize: '28px' }}>⭐</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>AI Quality Engine</h1>
              {p.grade && <GradeBadge grade={p.grade} />}
            </div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
              Success rate, escalation rate, user feedback, and latency — per module and per org.
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

        {loading ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '60px 0' }}>Calculating AI quality scores...</div>
        ) : (
          <>
            {/* Platform summary */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <MetricCard label="Quality Score" value={p.qualityScore} color={GRADE_COLOR[p.grade || 'F']} />
              <MetricCard label="Success Rate" value={`${p.successRate}%`} color={p.successRate >= 99 ? '#D8B16A' : '#f59e0b'} />
              <MetricCard label="Escalation Rate" value={`${p.escalationRate}%`} color={p.escalationRate < 5 ? '#D8B16A' : '#ef4444'} />
              <MetricCard label="👍 Positive" value={`${p.positiveFeedbackRate}%`} color="#D8B16A" sub={`${p.feedbackCoverage}% coverage`} />
              <MetricCard label="👎 Negative" value={`${p.negativeFeedbackRate}%`} color="#ef4444" />
              <MetricCard label="Avg Latency" value={`${p.avgLatencyMs}ms`} color={p.avgLatencyMs > 3000 ? '#ef4444' : '#3b82f6'} />
            </div>

            {/* View toggle */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
              {[{ id: 'platform', label: '🌐 Platform View' }, { id: 'orgs', label: '🏢 Per Org' }].map(v => (
                <button key={v.id} onClick={() => setView(v.id)} style={{
                  padding: '7px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                  background: view === v.id ? '#D8B16A' : '#1a2235', color: view === v.id ? '#0a0f1a' : '#94a3b8',
                }}>{v.label}</button>
              ))}
            </div>

            {view === 'platform' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                {/* By Module */}
                <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px', borderBottom: '1px solid #1a2235', fontWeight: '700', fontSize: '14px' }}>Quality by Module</div>
                  {(data?.byModule || []).map((m, i) => (
                    <div key={m.module} style={{ padding: '12px 18px', borderBottom: i < data.byModule.length - 1 ? '1px solid #0f1624' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '18px' }}>{MODULE_ICON[m.module] || '⚙️'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{m.module}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{m.calls} calls · {m.avgLatency}ms avg</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: m.successRate >= 99 ? '#D8B16A' : '#f59e0b' }}>{m.successRate}%</div>
                        <div style={{ fontSize: '11px', color: m.escalationRate > 10 ? '#ef4444' : '#64748b' }}>↑{m.escalationRate}% escalated</div>
                      </div>
                    </div>
                  ))}
                  {(!data?.byModule?.length) && <div style={{ padding: '20px', color: '#64748b', fontSize: '13px' }}>No data yet</div>}
                </div>

                {/* By Model */}
                <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px', borderBottom: '1px solid #1a2235', fontWeight: '700', fontSize: '14px' }}>Quality by Model</div>
                  {(data?.byModel || []).map((m, i) => (
                    <div key={m.model} style={{ padding: '12px 18px', borderBottom: i < data.byModel.length - 1 ? '1px solid #0f1624' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>{m.provider}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.model}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0' }}>{m.calls} calls</div>
                        <div style={{ fontSize: '11px', color: m.successRate >= 99 ? '#D8B16A' : '#f59e0b' }}>{m.successRate}% success · {m.avgLatency}ms</div>
                      </div>
                    </div>
                  ))}
                  {(!data?.byModel?.length) && <div style={{ padding: '20px', color: '#64748b', fontSize: '13px' }}>No data yet</div>}
                </div>

                {/* Top Errors */}
                {data?.topErrors?.length > 0 && (
                  <div style={{ background: '#111622', border: '1px solid #ef444433', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 18px', borderBottom: '1px solid #1a2235', fontWeight: '700', fontSize: '14px', color: '#ef4444' }}>⚠️ Top Errors</div>
                    {data.topErrors.map((e, i) => (
                      <div key={i} style={{ padding: '10px 18px', borderBottom: i < data.topErrors.length - 1 ? '1px solid #0f1624' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '12px' }}>{e.errorType}</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444', flexShrink: 0 }}>{e.count}×</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Daily Trend */}
                {data?.dailyTrend?.length > 0 && (
                  <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '20px' }}>
                    <div style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px' }}>Daily Success Rate</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '70px' }}>
                      {data.dailyTrend.map((d, i) => {
                        const h = Math.max(4, (d.successRate / 100) * 70)
                        const color = d.successRate >= 99 ? '#D8B16A' : d.successRate >= 90 ? '#f59e0b' : '#ef4444'
                        return (
                          <div key={i} title={`${d.date}: ${d.successRate}% success, ${d.escalations} escalations`}
                            style={{ flex: 1, height: `${h}px`, background: color, borderRadius: '2px 2px 0 0', cursor: 'pointer', opacity: 0.85 }} />
                        )
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                      <span>{data.dailyTrend[0]?.date}</span>
                      <span>{data.dailyTrend.at(-1)?.date}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {view === 'orgs' && (
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1a2235' }}>
                      {['Grade', 'Organization', 'Score', 'Calls', 'Success Rate', 'Escalation', '👍 Feedback', 'Latency'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No AI usage data yet</td></tr>
                    ) : orgs.map((org, i) => (
                      <tr key={org.orgId} style={{ borderBottom: i < orgs.length - 1 ? '1px solid #0f1624' : 'none' }}>
                        <td style={{ padding: '12px 16px' }}><GradeBadge grade={org.grade} /></td>
                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>{org.orgName}</td>
                        <td style={{ padding: '12px 16px', color: GRADE_COLOR[org.grade], fontWeight: '700' }}>{org.qualityScore}</td>
                        <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{org.totalCalls}</td>
                        <td style={{ padding: '12px 16px', color: org.successRate >= 99 ? '#D8B16A' : '#f59e0b' }}>{org.successRate}%</td>
                        <td style={{ padding: '12px 16px', color: org.escalationRate > 10 ? '#ef4444' : '#94a3b8' }}>{org.escalationRate}%</td>
                        <td style={{ padding: '12px 16px', color: '#D8B16A' }}>{org.positiveFeedbackRate}%</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{org.avgLatencyMs}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
