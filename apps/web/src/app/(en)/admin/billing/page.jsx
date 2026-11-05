'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const PLAN_COLORS = { STARTER: '#3b82f6', GROWTH: '#D8B16A', ENTERPRISE: '#a78bfa' }
const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0))

function Stat({ label, value, sub, color }) {
  return (
    <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '12px', padding: '20px' }}>
      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 900, color: color || '#e2e8f0', marginTop: '6px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

export default function BillingDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getPlatformBilling()
      .then(setData)
      .catch(e => setError(e?.message || 'Failed to load billing data'))
      .finally(() => setLoading(false))
  }, [])

  const maxMrr = data ? Math.max(...data.byPlan.map(p => p.mrr), 1) : 1

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <NavSidebar current="admin" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, letterSpacing: '0.08em' }}>MASTER CONTROL · OWNER ONLY</div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0' }}>Finance &amp; Billing</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Platform-wide revenue, subscriptions, invoices, and AI cost.</p>
        </div>

        {loading ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '60px', fontSize: '14px' }}>Loading finance data…</div>
        ) : error ? (
          <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '10px', padding: '20px', color: '#ef4444', fontSize: '14px' }}>⚠️ {error}</div>
        ) : data && (
          <>
            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '28px' }}>
              <Stat label="MRR" value={`${fmt(data.mrr)} ${data.currency}`} sub="Monthly recurring revenue" color="#D8B16A" />
              <Stat label="ARR" value={`${fmt(data.arr)} ${data.currency}`} sub="Annual run rate" color="#a78bfa" />
              <Stat label="Active Subscriptions" value={fmt(data.activeSubscriptions)} sub={`${data.totalInvoices} invoices total`} color="#3b82f6" />
              <Stat label="Lifetime Revenue" value={`${fmt(data.lifetimeRevenueQar)} ${data.currency}`} sub="All paid invoices" />
              <Stat label="AI Cost (30d)" value={`$${data.aiCost30dUsd}`} sub="LLM spend across platform" color="#f59e0b" />
            </div>

            {/* Revenue by plan */}
            <h3 style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '12px' }}>REVENUE BY PLAN</h3>
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
              {data.byPlan.map(p => (
                <div key={p.plan} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: PLAN_COLORS[p.plan] }} />
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{p.plan}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{p.count} org{p.count !== 1 ? 's' : ''} × {p.price} {data.currency}</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: PLAN_COLORS[p.plan] }}>{fmt(p.mrr)} {data.currency}/mo</span>
                  </div>
                  <div style={{ height: '8px', background: '#0c0f1a', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(p.mrr / maxMrr) * 100}%`, background: PLAN_COLORS[p.plan], borderRadius: '4px', transition: 'width .4s' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent invoices */}
            <h3 style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '12px' }}>RECENT INVOICES</h3>
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '12px', overflow: 'hidden' }}>
              {data.recentInvoices.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  No invoices yet. Invoices appear here when clients are billed (real billing activates when Stripe is connected).
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1a2235' }}>
                      {['Organization', 'Amount', 'Status', 'Description', 'Date'].map(h => (
                        <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentInvoices.map((inv, i) => (
                      <tr key={inv.id} style={{ borderBottom: i < data.recentInvoices.length - 1 ? '1px solid #0f1624' : 'none' }}>
                        <td style={{ padding: '11px 14px', fontWeight: 600 }}>{inv.org}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 700 }}>{fmt(inv.amount)} {inv.currency}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, background: inv.status === 'paid' ? 'rgba(216,177,106,.12)' : 'rgba(245,158,11,.12)', color: inv.status === 'paid' ? '#D8B16A' : '#f59e0b' }}>{inv.status}</span>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#64748b' }}>{inv.description || '—'}</td>
                        <td style={{ padding: '11px 14px', color: '#64748b', fontSize: '11px' }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ marginTop: '20px', background: 'rgba(167,139,250,.04)', border: '1px solid rgba(167,139,250,.12)', borderRadius: '10px', padding: '14px 18px', fontSize: '12px', color: '#64748b', lineHeight: 1.7, maxWidth: '760px' }}>
              💡 MRR is computed from active org plans. Real payment capture activates when Stripe is connected (currently checkout is simulated). AI cost is live from usage logs.
            </div>
          </>
        )}
      </main>
    </div>
  )
}
