import Link from 'next/link'
import Reveal from '@/components/Reveal'

const GOLD = '#D8B16A'
const card = { background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '14px' }

const PORTFOLIO = [
  ['🌐', 'AI Websites', 'Conversion-focused sites with built-in AI chat and lead capture.'],
  ['☁️', 'AI SaaS Platforms', 'Multi-tenant SaaS products engineered to scale from day one.'],
  ['👥', 'CRM Systems', 'Pipelines, lead scoring and customer 360 — automated end to end.'],
  ['🗂️', 'ERP Systems', 'Operations, inventory and finance unified in one system.'],
  ['🤖', 'AI Agents', 'Autonomous agents trained on your data, working 24/7.'],
  ['🩺', 'Healthcare AI', 'Compliant clinical and patient-engagement AI for the GCC.'],
  ['🛒', 'E-commerce AI', 'Product discovery, recovery and support that lifts revenue.'],
  ['⚡', 'Automation', 'Workflow automation that removes repetitive manual work.'],
  ['🧩', 'Custom Software', 'Bespoke enterprise software built to exact requirements.'],
  ['📊', 'Business Intelligence', 'Dashboards and KPIs that turn data into decisions.'],
  ['🔗', 'Omnichannel Platforms', 'WhatsApp, Instagram, web and email in one shared inbox.'],
  ['🔌', 'AI Integration', 'Connect AI to the tools and APIs you already run on.'],
]
const INDUSTRIES = [
  ['🩺', 'Healthcare & Clinics'], ['🛍️', 'Retail & E-commerce'], ['🏘️', 'Real Estate'],
  ['🍽️', 'Hospitality & F&B'], ['💼', 'Professional Services'], ['🎓', 'Education'],
  ['💳', 'Finance & Insurance'], ['🏛️', 'Government & Public'],
]
const WHY = [
  ['⚡', 'Respond in seconds, not hours', 'AI answers every customer instantly across WhatsApp, Instagram, website and email — day or night, in Arabic and English.'],
  ['🧠', 'One platform, not six', 'Inbox, CRM, campaigns, automation and your own AI Brain — unified. Replace a stack of disconnected tools with a single system.'],
  ['🛡️', 'Qatar-built, enterprise-grade', 'Data hosted in Doha (me-central1), PDPL-aligned, with strict multi-tenant isolation and full audit logging.'],
]

export default function HomeSections() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .hs-card{ transition:transform .25s cubic-bezier(.2,.7,.2,1), border-color .25s, box-shadow .25s; }
        .hs-card:hover{ transform:translateY(-4px); border-color:rgba(216,177,106,.45); box-shadow:0 10px 30px -12px rgba(216,177,106,.25); }
        .hs-chip{ transition:border-color .2s, background .2s; }
        .hs-chip:hover{ border-color:rgba(216,177,106,.5); background:rgba(216,177,106,.06); }
      `}} />

      {/* ─── Portfolio / Services ───────────────────────────────────── */}
      <section id="portfolio" style={{ maxWidth: '1080px', margin: '0 auto', padding: '88px 24px 40px', scrollMarginTop: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.18em', color: GOLD, marginBottom: '14px' }}>WHAT WE BUILD</div>
          <h2 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 12px' }}>An AI studio behind your platform</h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '620px', margin: '0 auto', lineHeight: 1.7 }}>
            Hayya AI is the customer-engagement product of <strong style={{ color: '#e2e8f0' }}>Hayya Med AI</strong> — a full-stack
            AI & enterprise technology studio. The same team that builds Hayya AI can build the rest of your stack.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginTop: '40px' }}>
          {PORTFOLIO.map(([icon, title, desc], i) => (
            <Reveal key={title} delay={(i % 4) * 70} className="hs-card" style={{ ...card, padding: '22px' }}>
              <div style={{ fontSize: '26px', marginBottom: '12px' }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px', color: '#f1f5f9' }}>{title}</div>
              <div style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.6 }}>{desc}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── Industries ─────────────────────────────────────────────── */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '48px 24px 88px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.18em', color: GOLD, marginBottom: '12px' }}>INDUSTRIES WE SERVE</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,32px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Built for every customer-facing business</h2>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          {INDUSTRIES.map(([icon, name]) => (
            <div key={name} className="hs-chip" style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '12px 20px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '999px', fontSize: '13.5px', fontWeight: 600, color: '#e2e8f0' }}>
              <span style={{ fontSize: '17px' }}>{icon}</span>{name}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Why choose (honest proof, not fabricated quotes) ───────── */}
      <section style={{ background: '#0a0d16', borderTop: '1px solid #1a2235', borderBottom: '1px solid #1a2235', padding: '88px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.18em', color: GOLD, marginBottom: '12px' }}>WHY HAYYA AI</div>
            <h2 style={{ fontSize: 'clamp(26px,4.5vw,36px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Outcomes, not just features</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {WHY.map(([icon, title, desc], i) => (
              <Reveal key={title} delay={i * 90} className="hs-card" style={{ ...card, padding: '28px', borderTop: `3px solid ${GOLD}` }}>
                <div style={{ fontSize: '28px', marginBottom: '14px' }}>{icon}</div>
                <div style={{ fontWeight: 800, fontSize: '17px', marginBottom: '10px', color: '#f1f5f9' }}>{title}</div>
                <div style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.75 }}>{desc}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Book a demo ────────────────────────────────────────────── */}
      <section id="book-demo" style={{ position: 'relative', overflow: 'hidden', padding: '92px 24px', textAlign: 'center', scrollMarginTop: '80px' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 80% at 50% 0%, rgba(216,177,106,.10), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.18em', color: GOLD, marginBottom: '14px' }}>SEE IT ON YOUR BUSINESS</div>
          <h2 style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 14px' }}>Book a live demo</h2>
          <p style={{ fontSize: '15.5px', color: '#94a3b8', lineHeight: 1.7, margin: '0 0 30px' }}>
            We'll connect your channels, train an AI agent on your business, and show you the platform answering real
            customer questions — in under 20 minutes.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:abbas@hayyamed.ai?subject=Book%20a%20Hayya%20AI%20demo&body=Hi%20Hayya%20AI%20team%2C%20I'd%20like%20to%20book%20a%20demo." style={{ padding: '15px 32px', background: GOLD, borderRadius: '999px', color: '#070b0a', textDecoration: 'none', fontSize: '14px', fontWeight: 800, letterSpacing: '0.02em' }}>Book a demo →</a>
            <Link href="/register" style={{ padding: '15px 32px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '999px', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>Or start free</Link>
          </div>
          <p style={{ marginTop: '18px', fontSize: '12px', color: '#475569' }}>abbas@hayyamed.ai · +974 3367 7333 · Doha, Qatar</p>
        </div>
      </section>
    </>
  )
}
