'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const PLAN_COLORS = { starter: '#3b82f6', growth: '#D8B16A', enterprise: '#a78bfa' }

export default function PricingControl() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    api.getPlans()
      .then(p => setPlans(Array.isArray(p) ? p : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const setField = (id, field, value) => setPlans(ps => ps.map(p => p.id === id ? { ...p, [field]: value } : p))

  const save = async () => {
    setSaving(true)
    try {
      const payload = plans.map(p => ({ id: p.id, name: p.name, price: Number(p.price) }))
      const updated = await api.updatePlans(payload)
      setPlans(updated)
      setToast({ ok: true, msg: 'Prices updated — live everywhere instantly' })
    } catch (e) {
      setToast({ ok: false, msg: e?.message || 'Save failed' })
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <NavSidebar current="admin" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto', maxWidth: '900px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, letterSpacing: '0.08em' }}>MASTER CONTROL · OWNER ONLY</div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0' }}>Pricing Control</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Change your plan prices. Updates apply instantly across the website, signup, and billing.</p>
        </div>

        {loading ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '60px' }}>Loading plans…</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {plans.map(p => (
                <div key={p.id} style={{ background: '#111622', border: `1px solid ${PLAN_COLORS[p.id] || '#1a2235'}33`, borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: PLAN_COLORS[p.id] || '#64748b' }} />
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{p.id}</span>
                  </div>
                  <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '5px' }}>PLAN NAME</label>
                  <input value={p.name} onChange={e => setField(p.id, 'name', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', marginBottom: '14px' }} />
                  <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '5px' }}>PRICE / MONTH (QAR)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="number" min="0" value={p.price} onChange={e => setField(p.id, 'price', e.target.value)}
                      style={{ width: '100%', padding: '12px', background: '#0c0f1a', border: `1px solid ${PLAN_COLORS[p.id] || '#1a2235'}55`, borderRadius: '8px', color: PLAN_COLORS[p.id] || '#e2e8f0', fontSize: '22px', fontWeight: 900, outline: 'none', boxSizing: 'border-box' }} />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>QAR</span>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={save} disabled={saving}
              style={{ padding: '12px 28px', background: saving ? '#1a2235' : '#D8B16A', border: 'none', borderRadius: '10px', color: saving ? '#64748b' : '#07090f', fontWeight: 900, fontSize: '14px', cursor: saving ? 'wait' : 'pointer' }}>
              {saving ? 'Saving…' : '💾 Save prices'}
            </button>

            <div style={{ marginTop: '20px', background: 'rgba(167,139,250,.04)', border: '1px solid rgba(167,139,250,.12)', borderRadius: '10px', padding: '14px 18px', fontSize: '12px', color: '#64748b', lineHeight: 1.7 }}>
              💡 Prices update instantly everywhere clients see them. Real card charging activates when Stripe is connected; until then, checkout is recorded as a paid invoice for tracking.
            </div>
          </>
        )}

        {toast && (
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '10px', background: toast.ok ? '#D8B16A' : '#ef4444', color: toast.ok ? '#07090f' : '#fff', fontWeight: 700, fontSize: '13px', zIndex: 9999 }}>
            {toast.ok ? '✓ ' : '⚠️ '}{toast.msg}
          </div>
        )}
      </main>
    </div>
  )
}
