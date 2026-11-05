'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

import { lp } from '@/lib/i18n'

// Static feature/colour info; prices are fetched live from the owner-editable catalog.
const BASE = [
  { id: 'starter', price: 150, color: '#3b82f6' },
  { id: 'growth', price: 599, color: '#D8B16A', popular: true },
  { id: 'enterprise', price: 990, color: '#a78bfa' },
]

const T = {
  en: {
    h2: 'Qatar-priced plans',
    sub: 'Start free. Upgrade when you are ready. No annual lock-in.',
    popular: 'MOST POPULAR',
    period: '/month',
    cta: 'Get started →',
    price: (n) => `QAR ${n.toLocaleString('en-US')}`,
    plans: {
      starter: { name: 'Starter', features: ['10,000 messages/mo', '5,000 AI responses', '1,000 contacts', '5 team members'] },
      growth: { name: 'Growth', features: ['50,000 messages/mo', '20,000 AI responses', '5,000 contacts', '15 team members', 'Advanced AI agent'] },
      enterprise: { name: 'Enterprise', features: ['Unlimited everything', 'Dedicated AI agent', 'White-label option', 'Priority support', 'Custom integrations'] },
    },
  },
  ar: {
    h2: 'باقات مسعّرة بالريال القطري',
    sub: 'ابدأ مجاناً، ورقِّ باقتك متى شئت، دون التزام سنوي.',
    popular: 'الأكثر طلباً',
    period: 'شهرياً',
    cta: 'ابدأ الآن ←',
    price: (n) => `${n.toLocaleString('en-US')} ر.ق`,
    plans: {
      starter: { name: 'المبتدئة', features: ['10,000 رسالة شهرياً', '5,000 رد بالذكاء الاصطناعي', '1,000 جهة اتصال', '5 أعضاء في الفريق'] },
      growth: { name: 'النمو', features: ['50,000 رسالة شهرياً', '20,000 رد بالذكاء الاصطناعي', '5,000 جهة اتصال', '15 عضواً في الفريق', 'وكيل ذكاء اصطناعي متقدّم'] },
      enterprise: { name: 'المؤسسات', features: ['استخدام غير محدود في كل شيء', 'وكيل ذكاء اصطناعي مخصّص', 'خيار العلامة البيضاء (باسمك التجاري)', 'دعم ذو أولوية', 'تكاملات مخصّصة'] },
    },
  },
}

export default function PricingSection({ locale = 'en' }) {
  const t = T[locale] || T.en
  const ar = locale === 'ar'
  const [plans, setPlans] = useState(BASE)

  useEffect(() => {
    api.getPlans().then(live => {
      if (!Array.isArray(live)) return
      setPlans(BASE.map(b => {
        const l = live.find(x => x.id === b.id)
        // Live price wins; plan names stay translated (the catalog name is English-only).
        return l && Number.isFinite(Number(l.price)) ? { ...b, price: Number(l.price), liveName: l.name } : b
      }))
    }).catch(() => {})
  }, [])

  return (
    <section style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '12px' }}>{t.h2}</h2>
        <p style={{ fontSize: '15px', color: '#94a3b8' }}>{t.sub}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        {plans.map(p => {
          const copy = t.plans[p.id]
          const name = ar ? copy.name : (p.liveName || copy.name)
          return (
          <div key={p.id} style={{ padding: '24px', background: p.popular ? 'rgba(216,177,106,.04)' : '#0c0f1a', border: `1px solid ${p.popular ? 'rgba(216,177,106,.25)' : '#1a2235'}`, borderRadius: '10px', position: 'relative' }}>
            {p.popular && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '3px 12px', background: '#D8B16A', borderRadius: '20px', fontSize: ar ? '11px' : '9px', color: '#070b0a', fontWeight: '800', whiteSpace: 'nowrap' }}>{t.popular}</div>}
            <div style={{ fontSize: '13px', color: p.color, fontWeight: '700', marginBottom: '8px' }}>{name}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.02em' }}>{t.price(p.price)}</div>
            <div style={{ fontSize: ar ? '12px' : '11px', color: '#64748b', marginBottom: '20px' }}>{t.period}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {copy.features.map(f => (
                <li key={f} style={{ fontSize: ar ? '13px' : '12px', color: '#94a3b8', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: '#D8B16A', flexShrink: 0 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href={lp(locale, '/register')} style={{ display: 'block', textAlign: 'center', padding: '9px', background: p.popular ? '#D8B16A' : 'rgba(255,255,255,.04)', border: `1px solid ${p.popular ? 'transparent' : '#1a2235'}`, borderRadius: '6px', color: p.popular ? '#070b0a' : '#e2e8f0', textDecoration: 'none', fontSize: '12px', fontWeight: '700' }}>
              {t.cta}
            </Link>
          </div>
          )
        })}
      </div>
    </section>
  )
}
