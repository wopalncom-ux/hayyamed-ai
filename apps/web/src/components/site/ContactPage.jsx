import Reveal from '@/components/Reveal'
import ContactForm from '@/components/ContactForm'
import SiteHeader from '@/components/site/SiteHeader'
import CompanyFooter from '@/components/site/CompanyFooter'
import { SITE, lp } from '@/lib/i18n'

const wrap = { maxWidth: '1080px', margin: '0 auto', padding: '0 24px' }
const card = { background: '#0f1520', border: '1px solid #1a2235', borderRadius: '16px', padding: '24px' }
const MAP_QUERY = encodeURIComponent('Tejwaans Business Center, Grand Hamad St, Doha, Qatar')

const T = {
  en: {
    badge: 'CONTACT',
    h1: "Let's talk about your business",
    lead: (s) => (<>Questions, a demo request, or a partnership idea — reach the team behind Hayya AI directly. Hayya AI is built and operated by <strong style={s}>Hayya Med AI</strong>.</>),
    address: 'Address',
    addressLines: ['Zone 6, Street 970, Grand Hamad St', 'Building 2, 3rd Floor, Tejwaans Business Center', 'Doha, Qatar · P.O. Box 20278'],
    email: 'Email', phone: 'Phone', whatsapp: 'WhatsApp',
    waText: "Hi Hayya AI, I'd like to ask about the platform.",
    formH2: 'Send us a message',
    mapTitle: 'Hayya Med AI office location — Doha, Qatar',
    pageName: 'Contact Hayya AI',
  },
  ar: {
    badge: 'تواصل معنا',
    h1: 'لنتحدّث عن نشاطك التجاري',
    lead: (s) => (<>لديك سؤال، أو تريد عرضاً توضيحياً، أو فكرة شراكة؟ تواصل مباشرة مع الفريق الذي يقف وراء Hayya AI. منصة Hayya AI من تطوير وتشغيل <strong style={s}>هيّا ميد للذكاء الاصطناعي</strong>.</>),
    address: 'العنوان',
    addressLines: ['المنطقة 6، الشارع 970، شارع حمد الكبير', 'المبنى 2، الطابق الثالث، مركز Tejwaans للأعمال', 'الدوحة، قطر · ص.ب. 20278'],
    email: 'البريد الإلكتروني', phone: 'الهاتف', whatsapp: 'واتساب',
    waText: 'مرحباً Hayya AI، أودّ الاستفسار عن المنصة.',
    formH2: 'أرسل لنا رسالة',
    mapTitle: 'موقع مكتب هيّا ميد للذكاء الاصطناعي في الدوحة، قطر',
    pageName: 'تواصل مع Hayya AI',
  },
}

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="#25D366" width="26" height="26" aria-hidden><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm4.52 13.94c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.4 1.01 2.57.12.17 1.75 2.67 4.25 3.74.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.19.21-.58.21-1.08.14-1.19-.06-.11-.23-.17-.48-.29z" /></svg>
)

export default function ContactPage({ locale = 'en' }) {
  const t = T[locale] || T.en
  const ar = locale === 'ar'
  const strong = { color: '#e2e8f0' }
  const label = { fontWeight: 800, fontSize: ar ? '14px' : '13px', marginBottom: '6px' }
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: t.pageName,
    url: `${SITE}${lp(locale, '/contact')}`,
    inLanguage: locale,
    about: { '@id': `${SITE}/#org` },
  }

  return (
    <div style={{ background: '#070b0a', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', overflowX: 'hidden' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader locale={locale} path="/contact" links={['home', 'about']} />

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '56px 24px 40px' }}>
        <div style={{ display: 'inline-block', fontSize: ar ? '13px' : '11px', fontWeight: 800, letterSpacing: '0.14em', color: '#D8B16A', border: '1px solid rgba(216,177,106,.3)', borderRadius: '999px', padding: '6px 14px', marginBottom: '20px' }}>{t.badge}</div>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 14px' }}>{t.h1}</h1>
        <p style={{ fontSize: ar ? '16px' : '15.5px', color: '#94a3b8', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto' }}>{t.lead(strong)}</p>
      </section>

      {/* Info + Form */}
      <section style={{ ...wrap, marginBottom: '56px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'start' }}>
          {/* Info column */}
          <div style={{ display: 'grid', gap: '14px' }}>
            <Reveal style={card}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>📍</div>
              <div style={label}>{t.address}</div>
              <address style={{ fontStyle: 'normal', fontSize: ar ? '14px' : '13px', color: '#94a3b8', lineHeight: 1.7 }}>
                {t.addressLines.map((l, i) => (<span key={l}>{l}{i < t.addressLines.length - 1 && <br />}</span>))}
              </address>
            </Reveal>
            <Reveal delay={60} style={card}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>✉️</div>
              <div style={label}>{t.email}</div>
              <a href="mailto:abbas@hayyamed.ai" dir="ltr" style={{ fontSize: '13px', color: '#D8B16A', textDecoration: 'none' }}>abbas@hayyamed.ai</a>
            </Reveal>
            <Reveal delay={120} style={card}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>📞</div>
              <div style={label}>{t.phone}</div>
              <a href="tel:+97433677333" dir="ltr" style={{ fontSize: '13px', color: '#D8B16A', textDecoration: 'none' }}>+974 3367 7333</a>
            </Reveal>
            <Reveal delay={180} style={{ ...card, borderColor: 'rgba(37,211,102,.3)' }}>
              <a href={`https://wa.me/97433677333?text=${encodeURIComponent(t.waText)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#e2e8f0' }}>
                <WhatsAppIcon />
                <div>
                  <div style={{ fontWeight: 800, fontSize: ar ? '14px' : '13px' }}>{t.whatsapp}</div>
                  <div dir="ltr" style={{ fontSize: '12px', color: '#25D366' }}>+974 3367 7333</div>
                </div>
              </a>
            </Reveal>
          </div>

          {/* Form column */}
          <Reveal delay={90} style={{ ...card, padding: '32px', gridColumn: 'span 2' }} className="hai-contact-form">
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 20px' }}>{t.formH2}</h2>
            <ContactForm locale={locale} />
          </Reveal>
        </div>
        <style dangerouslySetInnerHTML={{ __html: '@media (max-width: 640px){ .hai-contact-form{ grid-column: auto !important; } }' }} />
      </section>

      {/* Map */}
      <section style={{ ...wrap, marginBottom: '64px' }}>
        <Reveal style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <iframe
            title={t.mapTitle}
            src={`https://www.google.com/maps?q=${MAP_QUERY}&hl=${locale}&output=embed`}
            width="100%"
            height="360"
            style={{ border: 0, display: 'block', filter: 'grayscale(0.15) invert(0.92) contrast(0.9)' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Reveal>
      </section>

      <CompanyFooter locale={locale} maxWidth="1080px" />
    </div>
  )
}
