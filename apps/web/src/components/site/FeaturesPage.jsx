import Link from 'next/link'
import Reveal from '@/components/Reveal'
import SiteHeader from '@/components/site/SiteHeader'
import { getFeatures } from '@/lib/features-content'
import { SITE, lp } from '@/lib/i18n'

export const FEATURES_META = {
  en: {
    title: 'Features — AI CRM, Omnichannel Inbox & Automation | Hayya AI',
    description: 'Explore Hayya AI\'s core features: omnichannel inbox, AI auto-reply, CRM & lead scoring, bulk campaigns, automation builder, and in-chat booking.',
  },
  ar: {
    title: 'المزايا — نظام CRM بالذكاء الاصطناعي وصندوق وارد موحّد وأتمتة | Hayya AI',
    description: 'تعرّف على مزايا Hayya AI الأساسية: صندوق وارد موحّد لكل القنوات، ورد آلي بالذكاء الاصطناعي، ونظام CRM مع تقييم العملاء المحتملين، وحملات جماعية، ومنشئ أتمتة، وحجز المواعيد من داخل المحادثة.',
  },
}

const T = {
  en: {
    eyebrow: 'FEATURES',
    h1a: 'Everything Your Team Needs to ', h1b: 'Engage Customers',
    lead: 'Replace six disconnected tools with one AI-powered platform built for Qatar and GCC businesses.',
    learn: 'Learn more →',
    ctaH2: 'See it in action',
    ctaP: 'Start automating your customer conversations today.',
    ctaBtn: 'Create your free account →',
    listName: 'Hayya AI Features',
  },
  ar: {
    eyebrow: 'المزايا',
    h1a: 'كل ما يحتاجه فريقك ', h1b: 'للتواصل مع العملاء',
    lead: 'منصة واحدة مدعومة بالذكاء الاصطناعي بدلاً من ست أدوات منفصلة، مصمَّمة للشركات في قطر ودول الخليج.',
    learn: 'اعرف المزيد ←',
    ctaH2: 'شاهده يعمل',
    ctaP: 'ابدأ أتمتة محادثات عملائك اليوم.',
    ctaBtn: 'أنشئ حسابك المجاني ←',
    listName: 'مزايا Hayya AI',
  },
}

export default function FeaturesPage({ locale = 'en' }) {
  const t = T[locale] || T.en
  const ar = locale === 'ar'
  const features = getFeatures(locale)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t.listName,
    description: FEATURES_META[locale].description,
    url: `${SITE}${lp(locale, '/features')}`,
    inLanguage: locale,
    hasPart: features.map((f) => ({ '@type': 'WebPage', name: f.title, url: `${SITE}${lp(locale, `/features/${f.slug}`)}` })),
  }

  return (
    <div style={{ background: '#070b0a', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader locale={locale} path="/features" links={['home', 'about', 'contact']} />

      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px 60px', textAlign: 'center' }}>
        <p style={{ fontSize: ar ? '13px' : '11px', color: '#D8B16A', letterSpacing: '0.12em', fontWeight: '800', marginBottom: '16px' }}>{t.eyebrow}</p>
        <h1 style={{ fontSize: '40px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '16px' }}>
          {t.h1a}<span style={{ color: '#D8B16A' }}>{t.h1b}</span>
        </h1>
        <p style={{ fontSize: '16px', color: '#94a3b8', lineHeight: '1.7' }}>{t.lead}</p>
      </section>

      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px 100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {features.map((f, i) => (
            <Reveal key={f.slug} delay={(i % 3) * 80}>
              <Link href={lp(locale, `/features/${f.slug}`)} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                <div style={{ padding: '28px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '12px', borderInlineStart: `3px solid ${f.color}`, height: '100%' }}>
                  <div style={{ fontSize: '32px', marginBottom: '14px' }}>{f.icon}</div>
                  <h2 style={{ fontWeight: '800', fontSize: '17px', margin: '0 0 10px' }}>{f.title}</h2>
                  <div style={{ fontSize: ar ? '14px' : '13px', color: '#94a3b8', lineHeight: '1.7', marginBottom: '16px' }}>{f.tagline}</div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: f.color }}>{t.learn}</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section style={{ background: '#0c0f1a', borderTop: '1px solid #1a2235', padding: '70px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '14px' }}>{t.ctaH2}</h2>
        <p style={{ fontSize: ar ? '15px' : '14px', color: '#94a3b8', marginBottom: '24px' }}>{t.ctaP}</p>
        <Link href={lp(locale, '/register')} style={{ display: 'inline-block', padding: '14px 36px', background: '#D8B16A', borderRadius: '8px', color: '#070b0a', textDecoration: 'none', fontSize: '15px', fontWeight: '800' }}>
          {t.ctaBtn}
        </Link>
      </section>
    </div>
  )
}
