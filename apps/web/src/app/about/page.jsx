import Link from 'next/link'
import Reveal from '@/components/Reveal'
import AiBackdrop from '@/components/AiBackdrop'

export const metadata = {
  title: 'About — Built & operated by Hayya Med AI',
  description: 'Hayya AI is built and operated by Hayya Med AI, an Artificial Intelligence Solutions & Enterprise Technology company in Doha, Qatar. Founded by Abbas Al Masri. Qatar-Born, GCC-Proven, Globally Ready.',
  alternates: { canonical: '/about' },
}

const wrap = { maxWidth: '900px', margin: '0 auto', padding: '0 24px' }
const card = { background: '#0f1520', border: '1px solid #1a2235', borderRadius: '16px', padding: '28px' }

export default function About() {
  return (
    <div style={{ background: '#07090f', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', overflowX: 'hidden' }}>
      {/* Nav */}
      <header style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', fontWeight: 900, fontSize: '18px', color: '#e2e8f0', textDecoration: 'none' }}><img src="/logo.svg" alt="Hayya AI" width="28" height="28" style={{ display: 'block' }} />Hayya<span style={{ color: '#C9A96E' }}> AI</span></Link>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none' }}>Home</Link>
          <Link href="/register" style={{ fontSize: '13px', fontWeight: 700, color: '#07090f', background: '#C9A96E', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}>Start free</Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ position: 'relative', textAlign: 'center', padding: '72px 24px 56px' }}>
        <AiBackdrop />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', color: '#C9A96E', border: '1px solid rgba(201,169,110,.3)', borderRadius: '999px', padding: '6px 14px', marginBottom: '22px' }}>BUILT &amp; OPERATED BY HAYYA MED AI</div>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 18px' }}>
            We build the <span className="hai-shimmer">AI</span> that runs your customer conversations
          </h1>
          <p style={{ fontSize: '17px', color: '#94a3b8', lineHeight: 1.7, maxWidth: '640px', margin: '0 auto' }}>
            Hayya AI is the customer-engagement platform from <strong style={{ color: '#e2e8f0' }}>Hayya Med AI</strong> — an
            Artificial Intelligence Solutions &amp; Enterprise Technology company, born in Doha with a global vision.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: '#64748b' }}>
            <span>🇶🇦 QATAR-BORN</span><span>· GCC-PROVEN ·</span><span>GLOBALLY READY</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ ...wrap, marginBottom: '64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
          {[['3', 'Channels — WhatsApp, Instagram, Web'], ['24/7', 'AI agents that never sleep'], ['100%', 'Data hosted in Qatar'], ['2025', 'Founded in Doha']].map(([n, l], i) => (
            <Reveal key={l} delay={i * 90} style={{ ...card, textAlign: 'center', padding: '22px 16px' }}>
              <div style={{ fontSize: '30px', fontWeight: 900, color: '#C9A96E' }}>{n}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', lineHeight: 1.5 }}>{l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Story + Mission */}
      <section style={{ ...wrap, marginBottom: '56px' }}>
        <Reveal style={card}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 14px' }}>Why we exist</h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.85, margin: '0 0 14px' }}>
            Hayya Med AI was established in Doha, Qatar to bridge a gap: world-class AI was reaching global enterprises,
            but not the businesses around us. We design and build AI-powered platforms, enterprise software and automation
            that any business — a clinic, a retailer, a service company — can put to work in minutes.
          </p>
          <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.85, margin: 0 }}>
            <strong style={{ color: '#e2e8f0' }}>Hayya AI</strong> is that vision made real for customer engagement: an AI
            agent that answers WhatsApp and Instagram instantly, trained on your own business, with your team one tap away.
          </p>
        </Reveal>
      </section>

      {/* What we do */}
      <section style={{ ...wrap, marginBottom: '56px' }}>
        <Reveal><h2 style={{ fontSize: '24px', fontWeight: 800, textAlign: 'center', margin: '0 0 22px' }}>What we build</h2></Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {[
            ['🤖', 'AI Agents', 'Trained on your content, answering across channels 24/7 in Arabic & English.'],
            ['💬', 'Omnichannel Inbox', 'WhatsApp, Instagram and website chat in one shared inbox with human takeover.'],
            ['⚡', 'Automation & CRM', 'Lead capture, follow-ups, pipeline and reporting — automated end to end.'],
          ].map(([icon, t, d], i) => (
            <Reveal key={t} delay={i * 90} style={card}>
              <div style={{ fontSize: '26px', marginBottom: '10px' }}>{icon}</div>
              <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '6px' }}>{t}</div>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>{d}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Founder */}
      <section style={{ ...wrap, marginBottom: '64px' }}>
        <Reveal style={{ ...card, display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg,#C9A96E,#7C1535)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', fontWeight: 900, color: '#fff', flexShrink: 0 }}>AA</div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#C9A96E', marginBottom: '6px' }}>FOUNDER</div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 4px' }}>Abbas Al Masri</h2>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>Founder &amp; Chief Executive Officer, Hayya Med AI</div>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.8, margin: 0 }}>
              A business leader with executive experience across healthcare and technology, Abbas founded Hayya Med AI in
              Doha, Qatar to bring practical, enterprise-grade AI to businesses in the GCC and beyond — starting with the
              conversations that win and keep customers.
            </p>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section style={{ position: 'relative', textAlign: 'center', padding: '72px 24px', borderTop: '1px solid #1a2235', background: '#0c0f1a' }}>
        <Reveal>
          <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 12px' }}>Put an AI agent on your business</h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', margin: '0 0 24px' }}>WhatsApp, Instagram and web — answering instantly, trained on you.</p>
          <Link href="/register" style={{ display: 'inline-block', padding: '14px 36px', background: '#C9A96E', borderRadius: '8px', color: '#07090f', textDecoration: 'none', fontSize: '15px', fontWeight: 800 }}>Create your free account →</Link>
        </Reveal>
      </section>

      {/* Footer */}
      <footer style={{ ...wrap, padding: '28px 24px', textAlign: 'center', fontSize: '11px', color: '#475569', lineHeight: 1.9 }}>
        Owned and managed by <a href="https://hayyamed.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}><strong>Hayya Med AI</strong></a> — Artificial Intelligence Solutions &amp; Enterprise Technology · Doha, Qatar<br />
        Contact: abbas@hayyamed.ai · +974 3367 7333 · © {new Date().getFullYear()} Hayya AI.
      </footer>
    </div>
  )
}
