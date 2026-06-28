'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

// Internal marketplace — the catalog of modules you can enable per client from
// the Client AI Operating Center. This page is the overview; toggles live in
// Clients → (a client) → Modules.
export default function MarketplacePage() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getModuleCatalog().then(m => setModules(Array.isArray(m) ? m : [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <NavSidebar current="marketplace" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '6px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, margin: 0 }}>🧩 Module Marketplace</h1>
            <p style={{ color: '#64748b', fontSize: '13px', maxWidth: '620px', marginTop: '6px', lineHeight: 1.6 }}>
              These are the building blocks of the platform. Enable or disable any module <strong style={{ color: '#94a3b8' }}>per client</strong> — paid add-ons let you charge a markup on top.
            </p>
          </div>
          <a href="/clients" style={{ padding: '10px 18px', background: '#00e5a0', color: '#07090f', borderRadius: '8px', fontWeight: 800, fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' }}>Manage per client →</a>
        </div>

        {loading ? <div style={{ color: '#64748b', padding: '40px', textAlign: 'center' }}>Loading…</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', marginTop: '20px' }}>
            {modules.map(m => (
              <div key={m.key} style={{ background: '#0f1520', border: '1px solid #1a2235', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '26px' }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '14px' }}>{m.name}</div>
                    <div style={{ fontSize: '11px', color: m.price > 0 ? '#fbbf24' : '#00e5a0', fontWeight: 700 }}>{m.price > 0 ? `QAR ${m.price}/mo add-on` : 'Included'}</div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, minHeight: '52px' }}>{m.desc}</div>
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.defaultOn ? 'On by default' : 'Optional'}</span>
                  <a href="/clients" style={{ fontSize: '11px', padding: '5px 12px', background: 'rgba(0,229,160,.1)', border: '1px solid rgba(0,229,160,.3)', borderRadius: '6px', color: '#00e5a0', fontWeight: 700, textDecoration: 'none' }}>Enable for client</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
