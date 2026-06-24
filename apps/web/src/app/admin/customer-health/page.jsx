'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const RISK_COLOR = { LOW: '#00e5a0', MEDIUM: '#f59e0b', HIGH: '#ef4444' }
const RISK_BG = { LOW: '#00e5a022', MEDIUM: '#f59e0b22', HIGH: '#ef444422' }
const PLAN_COLOR = { STARTER: '#3b82f6', GROWTH: '#00e5a0', ENTERPRISE: '#a78bfa' }

function ScoreRing({ value, color, size = 56 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a2235" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        style={{ fill: '#e2e8f0', fontSize: size * 0.22, fontWeight: 800, transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px` }}>
        {value}
      </text>
    </svg>
  )
}

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{label}</span>
        <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: '700' }}>{value}</span>
      </div>
      <div style={{ height: '5px', background: '#1a2235', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: '3px', transition: 'width 0.6s' }} />
      </div>
    </div>
  )
}

function OrgCard({ org, expanded, onToggle }) {
  const risk = org.churnRisk
  return (
    <div style={{ background: '#111622', border: `1px solid ${RISK_COLOR[risk]}33`, borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', cursor: 'pointer' }}>
        <ScoreRing value={org.overallScore}
          color={org.overallScore >= 60 ? '#00e5a0' : org.overallScore >= 30 ? '#f59e0b' : '#ef4444'} size={52} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '700', fontSize: '14px' }}>{org.orgName}</span>
            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: PLAN_COLOR[org.plan] + '22', color: PLAN_COLOR[org.plan], fontWeight: '700' }}>
              {org.plan}
            </span>
            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: RISK_BG[risk], color: RISK_COLOR[risk], fontWeight: '700' }}>
              {risk} RISK
            </span>
          </div>
          {org.lastActivity && (
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
              Last active: {new Date(org.lastActivity).toLocaleDateString()}
            </div>
          )}
          {org.signals?.length > 0 && (
            <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '3px' }}>
              ⚠️ {org.signals[0]}{org.signals.length > 1 ? ` +${org.signals.length - 1} more` : ''}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
          {[
            { label: 'Engage', val: org.engagementScore, color: '#3b82f6' },
            { label: 'Adopt', val: org.adoptionScore, color: '#a78bfa' },
            { label: 'Auto', val: org.automationScore, color: '#f97316' },
            { label: 'AI', val: org.aiUsageScore, color: '#00e5a0' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', minWidth: '36px' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <span style={{ color: '#64748b', fontSize: '16px', marginLeft: '8px' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #1a2235', padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '10px' }}>SCORE BREAKDOWN</div>
            <ScoreBar label="Engagement (logins, messages, contacts)" value={org.engagementScore} color="#3b82f6" />
            <ScoreBar label="Adoption (features used)" value={org.adoptionScore} color="#a78bfa" />
            <ScoreBar label="Automation (workflows, AI agents)" value={org.automationScore} color="#f97316" />
            <ScoreBar label="AI Usage (calls per contact)" value={org.aiUsageScore} color="#00e5a0" />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '10px' }}>RISK SIGNALS</div>
            {org.signals?.length > 0 ? org.signals.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                <span style={{ color: '#ef4444', fontSize: '12px' }}>●</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{s}</span>
              </div>
            )) : (
              <div style={{ fontSize: '12px', color: '#00e5a0' }}>✓ No risk signals detected</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CustomerHealthPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.getCustomerHealth()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const orgs = data?.atRisk?.concat(data?.healthiest || []) || []
  const filtered = filter === 'all' ? orgs
    : filter === 'high' ? data?.atRisk?.filter(o => o.churnRisk === 'HIGH') || []
    : filter === 'medium' ? data?.atRisk?.filter(o => o.churnRisk === 'MEDIUM') || []
    : data?.healthiest || []

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <NavSidebar />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>

        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <span style={{ fontSize: '28px' }}>💚</span>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Customer Health</h1>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            Engagement, adoption, automation, and AI usage scores — identify churn risk before it happens.
          </p>
        </div>

        {loading ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '60px 0' }}>Calculating health scores...</div>
        ) : !data ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '60px 0' }}>No data available</div>
        ) : (
          <>
            {/* Summary */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {[
                { label: 'Total Orgs', value: data.total, color: '#e2e8f0' },
                { label: 'Avg Health Score', value: data.avgScore, color: data.avgScore >= 60 ? '#00e5a0' : '#f59e0b' },
                { label: '🔴 High Risk', value: data.high, color: '#ef4444' },
                { label: '🟡 Medium Risk', value: data.medium, color: '#f59e0b' },
                { label: '🟢 Healthy', value: data.low, color: '#00e5a0' },
              ].map(s => (
                <div key={s.label} style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '16px 20px', flex: 1, minWidth: '130px' }}>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
              {[
                { id: 'all', label: 'All Orgs' },
                { id: 'high', label: '🔴 High Risk' },
                { id: 'medium', label: '🟡 Medium Risk' },
                { id: 'healthy', label: '🟢 Healthy' },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  padding: '7px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                  background: filter === f.id ? '#00e5a0' : '#1a2235', color: filter === f.id ? '#0a0f1a' : '#94a3b8',
                }}>{f.label}</button>
              ))}
            </div>

            {/* Org list */}
            {filtered.length === 0 ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>No organizations match this filter</div>
            ) : filtered.map(org => (
              <OrgCard
                key={org.orgId}
                org={org}
                expanded={expanded === org.orgId}
                onToggle={() => setExpanded(expanded === org.orgId ? null : org.orgId)}
              />
            ))}
          </>
        )}
      </main>
    </div>
  )
}
