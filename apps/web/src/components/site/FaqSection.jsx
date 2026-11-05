import { FAQ, faqJsonLd } from '@/lib/faq'

const T = {
  en: { eyebrow: 'FAQ', h2: 'Frequently asked questions' },
  ar: { eyebrow: 'الأسئلة الشائعة', h2: 'أسئلة يطرحها عملاؤنا كثيراً' },
}

// Server-rendered FAQ (native <details>, no JS) + matching FAQPage JSON-LD.
export default function FaqSection({ locale = 'en' }) {
  const t = T[locale] || T.en
  const ar = locale === 'ar'
  return (
    <section id="faq" style={{ maxWidth: '820px', margin: '0 auto', padding: '80px 24px', scrollMarginTop: '80px' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(locale)) }} />
      <style dangerouslySetInnerHTML={{ __html: `
        .hai-faq summary { list-style:none; cursor:pointer; }
        .hai-faq summary::-webkit-details-marker { display:none; }
        .hai-faq summary::after { content:'+'; float:inline-end; color:#D8B16A; font-weight:800; }
        .hai-faq[open] summary::after { content:'−'; }
      ` }} />
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ fontSize: ar ? '13px' : '11px', fontWeight: 800, letterSpacing: '0.18em', color: '#D8B16A', marginBottom: '12px' }}>{t.eyebrow}</div>
        <h2 style={{ fontSize: 'clamp(26px,4.5vw,34px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>{t.h2}</h2>
      </div>
      <div style={{ display: 'grid', gap: '10px' }}>
        {FAQ[locale].map(({ q, a }) => (
          <details key={q} className="hai-faq" style={{ background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '10px', padding: '18px 20px' }}>
            <summary style={{ fontWeight: 700, fontSize: ar ? '16px' : '15px', color: '#e2e8f0' }}>
              <h3 style={{ display: 'inline', fontSize: 'inherit', fontWeight: 'inherit', margin: 0 }}>{q}</h3>
            </summary>
            <p style={{ fontSize: ar ? '15px' : '14px', color: '#94a3b8', lineHeight: 1.8, margin: '12px 0 0' }}>{a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
