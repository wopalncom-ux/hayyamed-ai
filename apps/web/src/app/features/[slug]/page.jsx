import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FEATURES_CONTENT, getFeatureContent } from '@/lib/features-content'

export function generateStaticParams() {
  return FEATURES_CONTENT.map((f) => ({ slug: f.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const feature = getFeatureContent(slug)
  if (!feature) return {}
  return {
    title: feature.metaTitle,
    description: feature.metaDescription,
    alternates: { canonical: `/features/${feature.slug}` },
    openGraph: { title: feature.metaTitle, description: feature.metaDescription, url: `https://www.hayyaai.com/features/${feature.slug}` },
  }
}

export default async function FeatureDetailPage({ params }) {
  const { slug } = await params
  const feature = getFeatureContent(slug)
  if (!feature) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: feature.title,
    description: feature.metaDescription,
    provider: { '@type': 'Organization', name: 'Hayya AI', parentOrganization: { '@type': 'Organization', name: 'Hayya Med AI' } },
    url: `https://www.hayyaai.com/features/${feature.slug}`,
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Features', item: 'https://www.hayyaai.com/features' },
      { '@type': 'ListItem', position: 2, name: feature.title, item: `https://www.hayyaai.com/features/${feature.slug}` },
    ],
  }

  const others = FEATURES_CONTENT.filter((f) => f.slug !== feature.slug).slice(0, 3)

  return (
    <div style={{ background: '#070b0a', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '100px 24px 50px' }}>
        <nav style={{ fontSize: '12px', color: '#64748b', marginBottom: '24px' }}>
          <Link href="/features" style={{ color: '#64748b', textDecoration: 'none' }}>Features</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: feature.color }}>{feature.title}</span>
        </nav>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>{feature.icon}</div>
        <h1 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '16px' }}>{feature.title}</h1>
        <p style={{ fontSize: '17px', color: '#94a3b8', lineHeight: '1.7' }}>{feature.tagline}</p>
      </section>

      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px 60px' }}>
        <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.8', marginBottom: '40px' }}>{feature.intro}</p>

        <h2 style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.08em', color: feature.color, marginBottom: '20px', textTransform: 'uppercase' }}>
          What's Included
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '48px' }}>
          {feature.capabilities.map((c) => (
            <div key={c.title} style={{ padding: '20px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '10px' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>{c.title}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>{c.desc}</div>
            </div>
          ))}
        </div>

        <Link href="/register" style={{ display: 'inline-block', padding: '14px 36px', background: feature.color, borderRadius: '8px', color: '#070b0a', textDecoration: 'none', fontSize: '15px', fontWeight: '800' }}>
          Try {feature.title} Free →
        </Link>
      </section>

      <section style={{ background: '#0c0f1a', borderTop: '1px solid #1a2235', padding: '50px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', color: '#64748b', marginBottom: '20px', textTransform: 'uppercase' }}>
            Other Features
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {others.map((f) => (
              <Link key={f.slug} href={`/features/${f.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', background: '#070b0a', border: '1px solid #1a2235', borderRadius: '8px', textDecoration: 'none', color: '#e2e8f0' }}>
                <span style={{ fontSize: '20px' }}>{f.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{f.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
