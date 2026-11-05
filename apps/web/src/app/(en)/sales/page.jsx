'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const STAGE_COLORS = {
  NEW: '#64748b', CONTACTED: '#3b82f6', QUALIFYING: '#06b6d4', QUALIFIED: '#D8B16A',
  PROPOSAL: '#f59e0b', NEGOTIATION: '#a78bfa',
}
const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0))

function Stat({ label, value, sub, color }) {
  return (
    <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '12px', padding: '20px' }}>
      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: 900, color: color || '#e2e8f0', marginTop: '6px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

export default function SalesDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getSalesReport()
      .then(setData)
      .catch(e => setError(e?.message || 'Failed to load sales data'))
      .finally(() => setLoading(false))
  }, [])

  const maxStageVal = data ? Math.max(...data.pipeline.map(p => p.value), 1) : 1
  const maxSourceVal = data ? Math.max(...data.bySource.map(s => s.value), 1) : 1

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <NavSidebar current="sales" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: 0 }}>Sales</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Pipeline value, win rate, forecast, and deal sources — from your live CRM.</p>
        </div>

        {loading ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '60px', fontSize: '14px' }}>Loading sales data…</div>
        ) : error ? (
          <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '10px', padding: '20px', color: '#ef4444', fontSize: '14px' }}>⚠️ {error}</div>
        ) : data && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '28px' }}>
              <Stat label="Open Pipeline" value={`${fmt(data.openValue)} ${data.currency}`} sub="Total value of open deals" color="#3b82f6" />
              <Stat label="Weighted Forecast" value={`${fmt(data.weightedForecast)} ${data.currency}`} sub="Probability-adjusted" color="#a78bfa" />
              <Stat label="Won Revenue" value={`${fmt(data.wonValue)} ${data.currency}`} sub={`${data.wonCount} deals won`} color="#D8B16A" />
              <Stat label="Win Rate" value={`${data.winRate}%`} sub={`${data.wonCount} won · ${data.lostCount} lost`} color={data.winRate >= 30 ? '#D8B16A' : '#f59e0b'} />
              <Stat label="Avg Deal Size" value={`${fmt(data.avgDealSize)} ${data.currency}`} sub="Per won deal" />
            </div>

            {/* Pipeline by stage */}
            <h3 style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '12px' }}>PIPELINE BY STAGE</h3>
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
              {data.pipeline.map(p => (
                <div key={p.stage} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: STAGE_COLORS[p.stage] }} />
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{p.stage}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{p.count} deal{p.count !== 1 ? 's' : ''}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: STAGE_COLORS[p.stage] }}>{fmt(p.value)} {data.currency}</span>
                  </div>
                  <div style={{ height: '8px', background: '#0c0f1a', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(p.value / maxStageVal) * 100}%`, background: STAGE_COLORS[p.stage], borderRadius: '4px', transition: 'width .4s' }} />
                  </div>
                </div>
              ))}
              {data.openValue === 0 && (
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', padding: '12px' }}>
                  No deal values yet. Add a <strong style={{ color: '#e2e8f0' }}>value</strong> to contacts to see pipeline revenue.
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* Deals by source */}
              <div>
                <h3 style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '12px' }}>DEALS BY SOURCE</h3>
                <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '12px', padding: '20px' }}>
                  {data.bySource.length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '20px' }}>No sources yet.</div>
                  ) : data.bySource.slice(0, 6).map(s => (
                    <div key={s.source} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{s.source}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#D8B16A' }}>{fmt(s.value)} {data.currency} · {s.count}</span>
                      </div>
                      <div style={{ height: '6px', background: '#0c0f1a', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(s.value / maxSourceVal) * 100}%`, background: '#D8B16A', borderRadius: '3px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent won */}
              <div>
                <h3 style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '12px' }}>RECENT WON DEALS</h3>
                <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '12px', overflow: 'hidden' }}>
                  {data.recentWon.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>No won deals yet. Mark contacts as WON to see them here.</div>
                  ) : data.recentWon.map((d, i) => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < data.recentWon.length - 1 ? '1px solid #0f1624' : 'none' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{d.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{d.source || '—'} · {new Date(d.wonAt).toLocaleDateString()}</div>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#D8B16A' }}>{fmt(d.value)} {d.currency}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
