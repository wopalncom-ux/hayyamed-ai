'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const CATEGORY_META = {
  ai_agent:          { label: 'AI Agents',          icon: '🤖', color: '#8b5cf6' },
  prompt_pack:       { label: 'Prompt Packs',        icon: '✍️', color: '#3b82f6' },
  workflow:          { label: 'Workflow Packs',       icon: '⚡', color: '#f97316' },
  crm_template:      { label: 'CRM Templates',       icon: '👥', color: '#00e5a0' },
  knowledge_pack:    { label: 'Knowledge Packs',     icon: '🧠', color: '#06b6d4' },
  industry_template: { label: 'Industry Templates',  icon: '🏭', color: '#fbbf24' },
}

const INDUSTRY_META = {
  healthcare:   { label: 'Healthcare',   icon: '🏥' },
  real_estate:  { label: 'Real Estate',  icon: '🏠' },
  ecommerce:    { label: 'E-Commerce',   icon: '🛒' },
  education:    { label: 'Education',    icon: '🎓' },
  qatar:        { label: 'Qatar',        icon: '🇶🇦' },
}

function StarRating({ rating, count }) {
  return (
    <span style={{ fontSize: '12px', color: '#fbbf24' }}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      <span style={{ color: '#64748b', marginLeft: '4px' }}>({count})</span>
    </span>
  )
}

function ItemCard({ item, installed, onInstall, onUninstall, installing }) {
  const cat = CATEGORY_META[item.category] || { label: item.category, icon: '📦', color: '#64748b' }
  return (
    <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Card header */}
      <div style={{ padding: '20px 20px 12px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ fontSize: '32px' }}>{cat.icon}</div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {item.isFeatured && (
              <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: '#fbbf2422', color: '#fbbf24', fontWeight: '700' }}>⭐ FEATURED</span>
            )}
            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: cat.color + '22', color: cat.color, fontWeight: '700' }}>{cat.label}</span>
          </div>
        </div>

        <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '6px', lineHeight: '1.3' }}>{item.name}</div>
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', marginBottom: '10px' }}>{item.description}</div>

        {item.industry && INDUSTRY_META[item.industry] && (
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#1a2235', color: '#94a3b8' }}>
            {INDUSTRY_META[item.industry].icon} {INDUSTRY_META[item.industry].label}
          </span>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
          <StarRating rating={item.rating || 0} count={item.ratingCount || 0} />
          <span style={{ fontSize: '11px', color: '#64748b' }}>↓ {item.downloads}</span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>by {item.authorName}</span>
        </div>
      </div>

      {/* Card footer */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #1a2235', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: item.price > 0 ? '#fbbf24' : '#00e5a0' }}>
          {item.price > 0 ? `$${item.price}/mo` : 'Free'}
        </span>
        {installed ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#00e5a0', fontWeight: '700' }}>✓ Installed</span>
            <button onClick={() => onUninstall(item.id)} style={{ fontSize: '11px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
          </div>
        ) : (
          <button
            onClick={() => onInstall(item.id)}
            disabled={installing === item.id}
            style={{
              padding: '7px 18px', borderRadius: '6px', border: 'none', cursor: installing === item.id ? 'not-allowed' : 'pointer',
              background: installing === item.id ? '#1a2235' : '#00e5a0', color: installing === item.id ? '#64748b' : '#0a0f1a',
              fontSize: '13px', fontWeight: '700', transition: 'all 0.15s',
            }}
          >
            {installing === item.id ? 'Installing...' : 'Install Free'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const [items, setItems] = useState([])
  const [installed, setInstalled] = useState([])
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState(null)
  const [category, setCategory] = useState('all')
  const [industry, setIndustry] = useState('all')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('browse') // browse | installed
  const [toast, setToast] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.getMarketplaceItems({ category: category !== 'all' ? category : undefined, industry: industry !== 'all' ? industry : undefined, search: search || undefined }),
      api.getInstalledItems(),
    ]).then(([all, inst]) => {
      setItems(Array.isArray(all) ? all : [])
      setInstalled((Array.isArray(inst) ? inst : []).map(i => i.itemId))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [category, industry, search])

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

  const handleInstall = async (id) => {
    setInstalling(id)
    try {
      await api.installMarketplaceItem(id)
      setInstalled(prev => [...prev, id])
      setItems(prev => prev.map(i => i.id === id ? { ...i, downloads: i.downloads + 1 } : i))
      showToast('Installed successfully')
    } catch (e) {
      showToast(e.message || 'Install failed', false)
    } finally {
      setInstalling(null)
    }
  }

  const handleUninstall = async (id) => {
    try {
      await api.uninstallMarketplaceItem(id)
      setInstalled(prev => prev.filter(i => i !== id))
      showToast('Removed')
    } catch {
      showToast('Remove failed', false)
    }
  }

  const displayed = tab === 'installed'
    ? items.filter(i => installed.includes(i.id))
    : items

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <NavSidebar current="marketplace" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>

        {/* Hero */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <span style={{ fontSize: '32px' }}>🏪</span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>Marketplace</h1>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px', maxWidth: '600px' }}>
            Ready-to-install AI agents, workflow automations, CRM templates, and industry starter packs. One click to deploy.
          </p>
        </div>

        {/* Tabs + Search */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[{ id: 'browse', label: '🏪 Browse' }, { id: 'installed', label: `✓ Installed (${installed.length})` }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                background: tab === t.id ? '#00e5a0' : '#1a2235', color: tab === t.id ? '#0a0f1a' : '#94a3b8',
              }}>{t.label}</button>
            ))}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
            style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', padding: '8px 14px', color: '#e2e8f0', fontSize: '13px', width: '220px' }} />
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => setCategory('all')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: category === 'all' ? '#e2e8f0' : '#1a2235', color: category === 'all' ? '#0a0f1a' : '#94a3b8' }}>
            All Types
          </button>
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <button key={key} onClick={() => setCategory(key)} style={{
              padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
              background: category === key ? meta.color : '#1a2235', color: category === key ? '#0a0f1a' : '#94a3b8',
            }}>{meta.icon} {meta.label}</button>
          ))}
        </div>

        {/* Industry filter */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button onClick={() => setIndustry('all')} style={{ padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '11px', background: industry === 'all' ? '#00e5a0' : '#1a2235', color: industry === 'all' ? '#0a0f1a' : '#64748b' }}>
            All Industries
          </button>
          {Object.entries(INDUSTRY_META).map(([key, meta]) => (
            <button key={key} onClick={() => setIndustry(key)} style={{
              padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '11px',
              background: industry === key ? '#00e5a0' : '#1a2235', color: industry === key ? '#0a0f1a' : '#64748b',
            }}>{meta.icon} {meta.label}</button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '60px 0' }}>Loading marketplace...</div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
            <div>{tab === 'installed' ? 'No installed items yet. Browse and install something!' : 'No items match your filters.'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {displayed.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                installed={installed.includes(item.id)}
                onInstall={handleInstall}
                onUninstall={handleUninstall}
                installing={installing}
              />
            ))}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '8px',
            background: toast.ok ? '#00e5a0' : '#ef4444', color: '#0a0f1a', fontWeight: '700', fontSize: '14px',
            zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>{toast.msg}</div>
        )}
      </main>
    </div>
  )
}
