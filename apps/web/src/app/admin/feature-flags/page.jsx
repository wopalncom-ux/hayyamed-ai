'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const PLAN_ORDER = { STARTER: 0, GROWTH: 1, ENTERPRISE: 2 }
const PLAN_COLOR = { STARTER: '#3b82f6', GROWTH: '#D8B16A', ENTERPRISE: '#a78bfa' }
const CATEGORY_ICON = {
  ai: '🤖', channels: '📡', marketing: '📣', automation: '⚡', crm: '👥',
  analytics: '📊', billing: '💳', platform: '🏗️', general: '⚙️',
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? '#D8B16A' : '#1a2235', transition: 'all 0.2s', position: 'relative', flexShrink: 0,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: '3px', left: checked ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
      }} />
    </button>
  )
}

function PlanBadge({ plan }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px',
      background: PLAN_COLOR[plan] + '22', color: PLAN_COLOR[plan], border: `1px solid ${PLAN_COLOR[plan]}44`,
    }}>{plan}</span>
  )
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)

  const load = () => {
    setLoading(true)
    api.getFeatureFlags()
      .then(data => setFlags(Array.isArray(data) ? data : []))
      .catch(() => setFlags([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const toggle = async (flag, field, value) => {
    setSaving(flag.key + field)
    try {
      await api.updateFeatureFlag(flag.key, { [field]: value })
      setFlags(prev => prev.map(f => f.key === flag.key ? { ...f, [field]: value } : f))
      showToast(`${flag.name} ${field === 'isEnabled' ? (value ? 'enabled' : 'disabled') : 'updated'}`)
    } catch {
      showToast('Failed to update flag', false)
    } finally {
      setSaving(null)
    }
  }

  const setPlan = async (flag, minPlan) => {
    setSaving(flag.key + 'plan')
    try {
      await api.updateFeatureFlag(flag.key, { minPlan })
      setFlags(prev => prev.map(f => f.key === flag.key ? { ...f, minPlan } : f))
      showToast(`${flag.name} min plan → ${minPlan}`)
    } catch {
      showToast('Failed to update', false)
    } finally {
      setSaving(null)
    }
  }

  const categories = ['all', ...Array.from(new Set(flags.map(f => f.category))).sort()]

  const filtered = flags.filter(f => {
    if (filter !== 'all' && f.category !== filter) return false
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) && !f.key.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const grouped = filtered.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = []
    acc[f.category].push(f)
    return acc
  }, {})

  const stats = {
    total: flags.length,
    enabled: flags.filter(f => f.isEnabled).length,
    beta: flags.filter(f => f.isBeta).length,
    enterprise: flags.filter(f => f.minPlan === 'ENTERPRISE').length,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <NavSidebar />
      <main style={{ flex: 1, padding: '32px', maxWidth: '1100px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <span style={{ fontSize: '28px' }}>🚩</span>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Feature Flags</h1>
            <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', background: '#D8B16A22', color: '#D8B16A', border: '1px solid #D8B16A44' }}>
              Global Control
            </span>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            Enable, disable, and gate features by plan. Changes take effect within 30 seconds.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Flags', value: stats.total, color: '#e2e8f0' },
            { label: 'Enabled', value: stats.enabled, color: '#D8B16A' },
            { label: 'Beta / Upcoming', value: stats.beta, color: '#f59e0b' },
            { label: 'Enterprise Only', value: stats.enterprise, color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '14px 20px', minWidth: '130px' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search flags..."
            style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', padding: '8px 12px', color: '#e2e8f0', fontSize: '13px', width: '200px' }}
          />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                  background: filter === cat ? '#D8B16A' : '#1a2235', color: filter === cat ? '#0a0f1a' : '#94a3b8',
                }}
              >
                {cat === 'all' ? 'All' : `${CATEGORY_ICON[cat] || '⚙️'} ${cat}`}
              </button>
            ))}
          </div>
        </div>

        {/* Flags Table */}
        {loading ? (
          <div style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>Loading flags...</div>
        ) : (
          Object.entries(grouped).map(([cat, catFlags]) => (
            <div key={cat} style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '10px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {CATEGORY_ICON[cat] || '⚙️'} {cat}
              </div>
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', overflow: 'hidden' }}>
                {catFlags.map((flag, i) => (
                  <div key={flag.key} style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px',
                    borderBottom: i < catFlags.length - 1 ? '1px solid #1a2235' : 'none',
                  }}>
                    {/* Enable toggle */}
                    <Toggle
                      checked={flag.isEnabled}
                      onChange={v => toggle(flag, 'isEnabled', v)}
                      disabled={saving === flag.key + 'isEnabled'}
                    />

                    {/* Flag info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '600', fontSize: '14px' }}>{flag.name}</span>
                        <code style={{ fontSize: '11px', color: '#64748b', background: '#0a0f1a', padding: '1px 6px', borderRadius: '3px' }}>
                          {flag.key}
                        </code>
                        {flag.isBeta && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b44' }}>BETA</span>
                        )}
                      </div>
                      {flag.description && (
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{flag.description}</div>
                      )}
                    </div>

                    {/* Min plan selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Min:</span>
                      <select
                        value={flag.minPlan}
                        onChange={e => setPlan(flag, e.target.value)}
                        disabled={saving === flag.key + 'plan'}
                        style={{
                          background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '5px',
                          color: PLAN_COLOR[flag.minPlan], fontSize: '11px', padding: '4px 8px', cursor: 'pointer', fontWeight: '700',
                        }}
                      >
                        <option value="STARTER">STARTER</option>
                        <option value="GROWTH">GROWTH</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                    </div>

                    {/* Beta toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Beta</span>
                      <Toggle
                        checked={flag.isBeta}
                        onChange={v => toggle(flag, 'isBeta', v)}
                        disabled={saving === flag.key + 'isBeta'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '8px',
            background: toast.ok ? '#D8B16A' : '#ef4444', color: '#0a0f1a', fontWeight: '700', fontSize: '14px',
            zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            {toast.msg}
          </div>
        )}
      </main>
    </div>
  )
}
