'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

// Static feature/colour info; prices are fetched live from the owner-editable catalog.
const BASE = [
  { id: 'starter', name: 'Starter', price: 'QAR 150', period: '/month', color: '#3b82f6',
    features: ['10,000 messages/mo', '5,000 AI responses', '1,000 contacts', '5 team members'] },
  { id: 'growth', name: 'Growth', price: 'QAR 599', period: '/month', color: '#C9A96E', popular: true,
    features: ['50,000 messages/mo', '20,000 AI responses', '5,000 contacts', '15 team members', 'Advanced AI agent'] },
  { id: 'enterprise', name: 'Enterprise', price: 'QAR 990', period: '/month', color: '#a78bfa',
    features: ['Unlimited everything', 'Dedicated AI agent', 'White-label option', 'Priority support', 'Custom integrations'] },
]

export default function PricingSection() {
  const [plans, setPlans] = useState(BASE)

  useEffect(() => {
    api.getPlans().then(live => {
      if (!Array.isArray(live)) return
      setPlans(BASE.map(b => {
        const l = live.find(x => x.id === b.id)
        return l ? { ...b, name: l.name || b.name, price: `QAR ${Number(l.price).toLocaleString()}` } : b
      }))
    }).catch(() => {})
  }, [])

  return (
    <section style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '12px' }}>Qatar-priced plans</h2>
        <p style={{ fontSize: '15px', color: '#94a3b8' }}>Start free. Upgrade when you are ready. No annual lock-in.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        {plans.map(p => (
          <div key={p.id} style={{ padding: '24px', background: p.popular ? 'rgba(201,169,110,.04)' : '#0c0f1a', border: `1px solid ${p.popular ? 'rgba(201,169,110,.25)' : '#1a2235'}`, borderRadius: '10px', position: 'relative' }}>
            {p.popular && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '3px 12px', background: '#C9A96E', borderRadius: '20px', fontSize: '9px', color: '#07090f', fontWeight: '800', whiteSpace: 'nowrap' }}>MOST POPULAR</div>}
            <div style={{ fontSize: '13px', color: p.color, fontWeight: '700', marginBottom: '8px' }}>{p.name}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.02em' }}>{p.price}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '20px' }}>{p.period}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {p.features.map(f => (
                <li key={f} style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: '#C9A96E', flexShrink: 0 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '9px', background: p.popular ? '#C9A96E' : 'rgba(255,255,255,.04)', border: `1px solid ${p.popular ? 'transparent' : '#1a2235'}`, borderRadius: '6px', color: p.popular ? '#07090f' : '#e2e8f0', textDecoration: 'none', fontSize: '12px', fontWeight: '700' }}>
              Get started →
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
