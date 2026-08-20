import Link from 'next/link'
import Reveal from '@/components/Reveal'
import ContactForm from '@/components/ContactForm'

export const metadata = {
  title: 'Contact — Hayya AI',
  description: 'Talk to Hayya AI. Book a demo, ask a question, or reach us by WhatsApp, email, or phone. Built and operated by Hayya Med AI in Doha, Qatar.',
  alternates: { canonical: '/contact' },
}

const wrap = { maxWidth: '1080px', margin: '0 auto', padding: '0 24px' }
const card = { background: '#0f1520', border: '1px solid #1a2235', borderRadius: '16px', padding: '24px' }

const MAP_QUERY = encodeURIComponent('Tejwaans Business Center, Grand Hamad St, Doha, Qatar')

export default function Contact() {
  return (
    <div style={{ background: '#070b0a', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', overflowX: 'hidden' }}>
      {/* Nav */}
      <header style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', fontWeight: 900, fontSize: '18px', color: '#e2e8f0', textDecoration: 'none' }}><img src="/logo.svg" alt="Hayya AI" width="28" height="28" style={{ display: 'block' }} />Hayya<span style={{ color: '#D8B16A' }}> AI</span></Link>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none' }}>Home</Link>
          <Link href="/about" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none' }}>About</Link>
          <Link href="/register" style={{ fontSize: '13px', fontWeight: 700, color: '#070b0a', background: '#D8B16A', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}>Start free</Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '56px 24px 40px' }}>
        <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', color: '#D8B16A', border: '1px solid rgba(216,177,106,.3)', borderRadius: '999px', padding: '6px 14px', marginBottom: '20px' }}>CONTACT</div>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 14px' }}>Let's talk about your business</h1>
        <p style={{ fontSize: '15.5px', color: '#94a3b8', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto' }}>
          Questions, a demo request, or a partnership idea — reach the team behind Hayya AI directly.
          Hayya AI is built and operated by <strong style={{ color: '#e2e8f0' }}>Hayya Med AI</strong>.
        </p>
      </section>

      {/* Info + Form */}
      <section style={{ ...wrap, marginBottom: '56px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 320px) 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Info column */}
          <div style={{ display: 'grid', gap: '14px' }}>
            <Reveal style={card}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>📍</div>
              <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>Address</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.7 }}>
                Zone 6, Street 970, Grand Hamad St<br />
                Building 2, 3rd Floor, Tejwaans Business Center<br />
                Doha, Qatar · P.O. Box 20278
              </div>
            </Reveal>
            <Reveal delay={60} style={card}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>✉️</div>
              <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>Email</div>
              <a href="mailto:abbas@hayyamed.ai" style={{ fontSize: '13px', color: '#D8B16A', textDecoration: 'none' }}>abbas@hayyamed.ai</a>
            </Reveal>
            <Reveal delay={120} style={card}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>📞</div>
              <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>Phone</div>
              <a href="tel:+97433677333" style={{ fontSize: '13px', color: '#D8B16A', textDecoration: 'none' }}>+974 3367 7333</a>
            </Reveal>
            <Reveal delay={180} style={{ ...card, borderColor: 'rgba(37,211,102,.3)' }}>
              <a href="https://wa.me/97433677333?text=Hi%20Hayya%20AI%2C%20I'd%20like%20to%20ask%20about%20the%20platform." target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#e2e8f0' }}>
                <svg viewBox="0 0 24 24" fill="#25D366" width="26" height="26"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm4.52 13.94c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.4 1.01 2.57.12.17 1.75 2.67 4.25 3.74.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.19.21-.58.21-1.08.14-1.19-.06-.11-.23-.17-.48-.29z" /></svg>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '13px' }}>WhatsApp</div>
                  <div style={{ fontSize: '12px', color: '#25D366' }}>+974 3367 7333</div>
                </div>
              </a>
            </Reveal>
          </div>

          {/* Form column */}
          <Reveal delay={90} style={{ ...card, padding: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 20px' }}>Send us a message</h2>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      {/* Map */}
      <section style={{ ...wrap, marginBottom: '64px' }}>
        <Reveal style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <iframe
            title="Hayya Med AI office location — Doha, Qatar"
            src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
            width="100%"
            height="360"
            style={{ border: 0, display: 'block', filter: 'grayscale(0.15) invert(0.92) contrast(0.9)' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Reveal>
      </section>

      {/* Footer */}
      <footer style={{ ...wrap, padding: '28px 24px', textAlign: 'center', fontSize: '11px', color: '#475569', lineHeight: 1.9 }}>
        Owned and managed by <a href="https://hayyamed.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}><strong>Hayya Med AI</strong></a> — Artificial Intelligence Solutions &amp; Enterprise Technology<br />
        Zone 6, Street 970, Grand Hamad St, Building 2, 3rd Floor, Tejwaans Business Center, Doha, Qatar · P.O. Box 20278<br />
        Contact: abbas@hayyamed.ai · +974 3367 7333 · © {new Date().getFullYear()} Hayya AI.
      </footer>
    </div>
  )
}
