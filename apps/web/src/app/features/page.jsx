import Link from 'next/link'
import Reveal from '@/components/Reveal'
import { FEATURES_CONTENT } from '@/lib/features-content'

export const metadata = {
  title: 'Features — AI CRM, Omnichannel Inbox & Automation | Hayya AI',
  description: 'Explore Hayya AI\'s core features: omnichannel inbox, AI auto-reply, CRM & lead scoring, bulk campaigns, automation builder, and in-chat booking.',
  alternates: { canonical: '/features' },
}

export default function FeaturesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Hayya AI Features',
    description: metadata.description,
    url: 'https://www.hayyaai.com/features',
  }

  return (
    <div style={{ background: '#070b0a', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '100px 24px 60px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: '#D8B16A', letterSpacing: '0.12em', fontWeight: '800', marginBottom: '16px' }}>FEATURES</p>
        <h1 style={{ fontSize: '40px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '16px' }}>
          Everything Your Team Needs to <span style={{ color: '#D8B16A' }}>Engage Customers</span>
        </h1>
        <p style={{ fontSize: '16px', color: '#94a3b8', lineHeight: '1.7' }}>
          Replace six disconnected tools with one AI-powered platform built for Qatar and GCC businesses.
        </p>
      </section>

      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px 100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {FEATURES_CONTENT.map((f, i) => (
            <Reveal key={f.slug} delay={(i % 3) * 80}>
              <Link href={`/features/${f.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                <div style={{ padding: '28px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '12px', borderLeft: `3px solid ${f.color}`, height: '100%' }}>
                  <div style={{ fontSize: '32px', marginBottom: '14px' }}>{f.icon}</div>
                  <div style={{ fontWeight: '800', fontSize: '17px', marginBottom: '10px' }}>{f.title}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.7', marginBottom: '16px' }}>{f.tagline}</div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: f.color }}>Learn more →</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section style={{ background: '#0c0f1a', borderTop: '1px solid #1a2235', padding: '70px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '14px' }}>See it in action</h2>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>Start automating your customer conversations today.</p>
        <Link href="/register" style={{ display: 'inline-block', padding: '14px 36px', background: '#D8B16A', borderRadius: '8px', color: '#070b0a', textDecoration: 'none', fontSize: '15px', fontWeight: '800' }}>
          Create your free account →
        </Link>
      </section>
    </div>
  )
}
