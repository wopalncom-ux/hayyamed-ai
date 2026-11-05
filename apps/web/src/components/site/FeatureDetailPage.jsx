import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import { getFeature, getFeatures } from '@/lib/features-content'
import { SITE, lp } from '@/lib/i18n'

const T = {
  en: { features: 'Features', home: 'Home', included: "What's Included", tryIt: (n) => `Try ${n} Free →`, others: 'Other Features' },
  ar: { features: 'المزايا', home: 'الرئيسية', included: 'ما الذي تتضمنه', tryIt: (n) => `جرّب ${n} مجاناً ←`, others: 'مزايا أخرى' },
}

export function featureMetadata(slug, locale) {
  const feature = getFeature(slug, locale)
  if (!feature) return null
  return { title: feature.metaTitle, description: feature.metaDescription, feature }
}

export default function FeatureDetailPage({ slug, locale = 'en' }) {
  const t = T[locale] || T.en
  const ar = locale === 'ar'
  const feature = getFeature(slug, locale)
  const url = `${SITE}${lp(locale, `/features/${feature.slug}`)}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: feature.title,
    description: feature.metaDescription,
    inLanguage: locale,
    serviceType: feature.title,
    areaServed: ['QA', 'SA', 'AE', 'KW', 'BH', 'OM'],
    provider: { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'Hayya AI', parentOrganization: { '@type': 'Organization', name: 'Hayya Med AI' } },
    url,
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t.home, item: `${SITE}${lp(locale, '/')}` },
      { '@type': 'ListItem', position: 2, name: t.features, item: `${SITE}${lp(locale, '/features')}` },
      { '@type': 'ListItem', position: 3, name: feature.title, item: url },
    ],
  }

  const others = getFeatures(locale).filter((f) => f.slug !== feature.slug).slice(0, 3)

  return (
    <div style={{ background: '#070b0a', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteHeader locale={locale} path={`/features/${feature.slug}`} links={['home', 'about', 'contact']} />

      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '56px 24px 50px' }}>
        <nav aria-label={ar ? 'مسار التنقل' : 'Breadcrumb'} style={{ fontSize: ar ? '13px' : '12px', color: '#64748b', marginBottom: '24px' }}>
          <Link href={lp(locale, '/features')} style={{ color: '#64748b', textDecoration: 'none' }}>{t.features}</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: feature.color }}>{feature.title}</span>
        </nav>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>{feature.icon}</div>
        <h1 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '16px' }}>{feature.title}</h1>
        <p style={{ fontSize: '17px', color: '#94a3b8', lineHeight: '1.7' }}>{feature.tagline}</p>
      </section>

      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px 60px' }}>
        <p style={{ fontSize: ar ? '16px' : '15px', color: '#94a3b8', lineHeight: '1.8', marginBottom: '40px' }}>{feature.intro}</p>

        <h2 style={{ fontSize: ar ? '16px' : '13px', fontWeight: '800', letterSpacing: '0.08em', color: feature.color, marginBottom: '20px', textTransform: 'uppercase' }}>
          {t.included}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '48px' }}>
          {feature.capabilities.map((c) => (
            <div key={c.title} style={{ padding: '20px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '10px' }}>
              <h3 style={{ fontWeight: '700', fontSize: ar ? '15px' : '14px', margin: '0 0 8px' }}>{c.title}</h3>
              <div style={{ fontSize: ar ? '14px' : '13px', color: '#94a3b8', lineHeight: '1.6' }}>{c.desc}</div>
            </div>
          ))}
        </div>

        <Link href={lp(locale, '/register')} style={{ display: 'inline-block', padding: '14px 36px', background: feature.color, borderRadius: '8px', color: '#070b0a', textDecoration: 'none', fontSize: '15px', fontWeight: '800' }}>
          {t.tryIt(feature.title)}
        </Link>
      </section>

      <section style={{ background: '#0c0f1a', borderTop: '1px solid #1a2235', padding: '50px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <p style={{ fontSize: ar ? '13px' : '11px', fontWeight: '800', letterSpacing: '0.08em', color: '#64748b', marginBottom: '20px', textTransform: 'uppercase' }}>
            {t.others}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {others.map((f) => (
              <Link key={f.slug} href={lp(locale, `/features/${f.slug}`)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', background: '#070b0a', border: '1px solid #1a2235', borderRadius: '8px', textDecoration: 'none', color: '#e2e8f0' }}>
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
