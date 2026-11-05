import Link from 'next/link'
import PricingSection from '@/components/PricingSection'
import Reveal from '@/components/Reveal'
import HeroVideo from '@/components/HeroVideo'
import HomeSections from '@/components/HomeSections'
import FaqSection from '@/components/site/FaqSection'
import LangSwitch from '@/components/site/LangSwitch'
import { getFeatures } from '@/lib/features-content'
import { lp } from '@/lib/i18n'

const CHANNELS = [
  { icon: '💬', en: 'WhatsApp', ar: 'واتساب', color: '#D8B16A' },
  { icon: '📸', en: 'Instagram', ar: 'إنستغرام', color: '#ec4899' },
  { icon: '👤', en: 'Facebook', ar: 'فيسبوك', color: '#3b82f6' },
  { icon: '📧', en: 'Email', ar: 'البريد الإلكتروني', color: '#fbbf24' },
  { icon: '💻', en: 'Web Chat', ar: 'دردشة الموقع', color: '#06b6d4' },
]

const T = {
  en: {
    channels: 'CONNECT ALL YOUR CHANNELS',
    stats: [
      { value: '5', label: 'Channels Connected' },
      { value: '24/7', label: 'AI Auto-Reply' },
      { value: '4', label: 'AI Providers' },
      { value: 'QAR', label: 'Qatar-Priced Plans' },
    ],
    featH2: 'Everything your team needs',
    featP: 'Replace 6 tools with one platform. Built specifically for the GCC market.',
    learn: 'Learn more →',
    howH2: 'Up and running in 5 minutes',
    steps: [
      { step: '1', title: 'Create your account', desc: 'Sign up and complete the 5-step onboarding wizard.' },
      { step: '2', title: 'Connect your channels', desc: 'Add your WhatsApp Business API, Instagram, and email.' },
      { step: '3', title: 'Activate your AI agent', desc: 'Your AI starts replying to customers immediately.' },
    ],
    builtEyebrow: 'BUILT & OPERATED BY',
    company: 'Hayya Med AI',
    builtP: (s) => (<>Hayya AI is built and operated by <strong style={s}>Hayya Med AI</strong> — an Artificial Intelligence Solutions &amp; Enterprise Technology company established in <strong style={s}>Doha, Qatar</strong> with a global vision. We design and build AI-powered platforms, enterprise software and automation for businesses across the GCC and beyond.</>),
    motto: 'Qatar-Born · GCC-Proven · Globally Ready',
    founded: 'Founded by Abbas Al Masri',
    doha: 'Doha, Qatar',
    ctaH2: 'Start automating your business today',
    ctaP: 'Join Qatar businesses using AI to respond faster, convert more leads, and grow revenue.',
    ctaBtn: 'Create your free account →',
    ctaNote: 'Data stored in Qatar · me-central1 (Doha) · PDPL compliant',
    foot: { about: 'About', contact: 'Contact', features: 'Features', developers: 'Developers', login: 'Log in', register: 'Sign up free' },
    owned: 'Owned and managed by',
    tagline: 'Artificial Intelligence Solutions & Enterprise Technology',
    address: 'Zone 6, Street 970, Grand Hamad St, Building 2, 3rd Floor, Tejwaans Business Center, Doha, Qatar · P.O. Box 20278',
    contact: 'Contact',
    rights: 'All rights reserved.',
  },
  ar: {
    channels: 'اربط جميع قنواتك',
    stats: [
      { value: '5', label: 'قنوات مربوطة' },
      { value: '24/7', label: 'رد آلي بالذكاء الاصطناعي' },
      { value: '4', label: 'مزوّدين للذكاء الاصطناعي' },
      { value: 'ر.ق', label: 'باقات بالريال القطري' },
    ],
    featH2: 'كل ما يحتاجه فريقك',
    featP: 'منصة واحدة بدلاً من ست أدوات، مصمَّمة خصيصاً لسوق الخليج.',
    learn: 'اعرف المزيد ←',
    howH2: 'جاهز للعمل خلال 5 دقائق',
    steps: [
      { step: '1', title: 'أنشئ حسابك', desc: 'سجّل وأكمل معالج الإعداد المكوّن من 5 خطوات.' },
      { step: '2', title: 'اربط قنواتك', desc: 'أضِف واتساب للأعمال (WhatsApp Business API) وإنستغرام والبريد الإلكتروني.' },
      { step: '3', title: 'فعّل وكيل الذكاء الاصطناعي', desc: 'يبدأ وكيلك الذكي بالرد على العملاء فوراً.' },
    ],
    builtEyebrow: 'من تطوير وتشغيل',
    company: 'هيّا ميد للذكاء الاصطناعي',
    builtP: (s) => (<>Hayya AI من تطوير وتشغيل <strong style={s}>هيّا ميد للذكاء الاصطناعي</strong> (Hayya Med AI)، وهي شركة متخصصة في حلول الذكاء الاصطناعي والتقنيات المؤسسية، تأسست في <strong style={s}>الدوحة، قطر</strong> برؤية عالمية. نصمّم ونبني منصات مدعومة بالذكاء الاصطناعي وبرمجيات مؤسسية وحلول أتمتة للشركات في دول الخليج وخارجها.</>),
    motto: 'وُلدت في قطر · أثبتت جدارتها في الخليج · جاهزة للعالم',
    founded: 'أسّسها عباس المصري',
    doha: 'الدوحة، قطر',
    ctaH2: 'ابدأ أتمتة أعمالك اليوم',
    ctaP: 'انضم إلى الشركات في قطر التي تستخدم الذكاء الاصطناعي للرد بشكل أسرع، وتحويل المزيد من العملاء المحتملين، وزيادة الإيرادات.',
    ctaBtn: 'أنشئ حسابك المجاني ←',
    ctaNote: 'بياناتك مخزّنة في قطر · me‑central1 (الدوحة) · متوافق مع قانون حماية خصوصية البيانات الشخصية',
    foot: { about: 'من نحن', contact: 'تواصل معنا', features: 'المزايا', developers: 'للمطوّرين', login: 'تسجيل الدخول', register: 'سجّل مجاناً' },
    owned: 'تملكها وتديرها شركة',
    tagline: 'حلول الذكاء الاصطناعي والتقنيات المؤسسية',
    address: 'المنطقة 6، الشارع 970، شارع حمد الكبير، المبنى 2، الطابق الثالث، مركز Tejwaans للأعمال، الدوحة، قطر · ص.ب. 20278',
    contact: 'للتواصل',
    rights: 'جميع الحقوق محفوظة.',
  },
}

export default function HomePage({ locale = 'en' }) {
  const t = T[locale] || T.en
  const ar = locale === 'ar'
  const features = getFeatures(locale)
  const strong = { color: '#e2e8f0' }
  const small = ar ? '13px' : '11px'

  return (
    <div style={{ background: '#070b0a', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh' }}>

      {/* ─── Hero (HLS video, glass card, mobile menu) ──────────────── */}
      <HeroVideo locale={locale} />

      {/* ─── Channel badges ─────────────────────────────────────────── */}
      <section style={{ maxWidth: '700px', margin: '0 auto 80px', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ fontSize: small, color: '#475569', letterSpacing: '0.08em', marginBottom: '16px', fontWeight: '700' }}>{t.channels}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {CHANNELS.map(ch => (
            <div key={ch.en} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '24px', fontSize: ar ? '13px' : '12px', fontWeight: '600' }}>
              <span>{ch.icon}</span>
              <span style={{ color: ch.color }}>{ch[locale] || ch.en}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Stats row ──────────────────────────────────────────────── */}
      <section style={{ background: '#0c0f1a', borderTop: '1px solid #1a2235', borderBottom: '1px solid #1a2235', padding: '32px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', textAlign: 'center' }}>
          {t.stats.map(s => (
            <div key={s.label}>
              <div dir="ltr" style={{ fontSize: '32px', fontWeight: '900', color: '#D8B16A' }}>{s.value}</div>
              <div style={{ fontSize: small, color: '#64748b', marginTop: '4px', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 24px', scrollMarginTop: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '12px' }}>{t.featH2}</h2>
          <p style={{ fontSize: '16px', color: '#94a3b8' }}>{t.featP}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {features.map((f, i) => (
            <Reveal key={f.slug} delay={(i % 3) * 80} style={{ padding: '24px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '10px', borderInlineStart: `3px solid ${f.color}` }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.icon}</div>
              <h3 style={{ fontWeight: '700', fontSize: '15px', margin: '0 0 8px', color: '#e2e8f0' }}>{f.title}</h3>
              <div style={{ fontSize: ar ? '14px' : '13px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '12px' }}>{f.tagline}</div>
              <Link href={lp(locale, `/features/${f.slug}`)} style={{ fontSize: ar ? '13px' : '12px', fontWeight: '700', color: f.color, textDecoration: 'none' }}>{t.learn}</Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── How it works ───────────────────────────────────────────── */}
      <section style={{ background: '#0c0f1a', borderTop: '1px solid #1a2235', borderBottom: '1px solid #1a2235', padding: '80px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '48px' }}>{t.howH2}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            {t.steps.map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(216,177,106,.08)', border: '2px solid rgba(216,177,106,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '18px', fontWeight: '900', color: '#D8B16A' }}>{s.step}</div>
                <h3 style={{ fontWeight: '700', fontSize: ar ? '16px' : '14px', margin: '0 0 6px' }}>{s.title}</h3>
                <div style={{ fontSize: ar ? '14px' : '12px', color: '#64748b', lineHeight: '1.6' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Portfolio · Industries · Why · Book demo ───────────────── */}
      <HomeSections locale={locale} />

      {/* ─── Pricing (live, owner-editable) ─────────────────────────── */}
      <div id="pricing" style={{ scrollMarginTop: '80px' }}><PricingSection locale={locale} /></div>

      {/* ─── FAQ (also FAQPage structured data) ─────────────────────── */}
      <FaqSection locale={locale} />

      {/* ─── Backed by Hayya Med AI ─────────────────────────────────── */}
      <section style={{ borderTop: '1px solid #1a2235', padding: '72px 24px', textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
        <div style={{ fontSize: small, color: '#D8B16A', fontWeight: '800', letterSpacing: '0.12em', marginBottom: '12px' }}>{t.builtEyebrow}</div>
        <h2 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '14px' }}>{t.company}</h2>
        <p style={{ fontSize: ar ? '16px' : '15px', color: '#94a3b8', lineHeight: '1.8', marginBottom: '18px' }}>
          {t.builtP(strong)}
        </p>
        <div style={{ fontSize: ar ? '14px' : '13px', color: '#64748b', fontWeight: '700', letterSpacing: '0.04em', marginBottom: '20px' }}>
          {t.motto}
        </div>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', fontSize: ar ? '13px' : '12px', color: '#64748b' }}>
          <a href="https://www.hayyamed.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#D8B16A', textDecoration: 'none' }}><span dir="ltr">hayyamed.ai ↗</span></a>
          <span>{t.founded}</span>
          <span>{t.doha}</span>
        </div>
      </section>

      {/* ─── Final CTA ──────────────────────────────────────────────── */}
      <section style={{ background: '#0c0f1a', borderTop: '1px solid #1a2235', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '12px' }}>{t.ctaH2}</h2>
        <p style={{ fontSize: ar ? '16px' : '15px', color: '#94a3b8', marginBottom: '28px' }}>{t.ctaP}</p>
        <Link href={lp(locale, '/register')} style={{ display: 'inline-block', padding: '14px 36px', background: '#D8B16A', borderRadius: '8px', color: '#070b0a', textDecoration: 'none', fontSize: '15px', fontWeight: '800', letterSpacing: '-0.01em' }}>
          {t.ctaBtn}
        </Link>
        <p style={{ marginTop: '14px', fontSize: ar ? '12px' : '11px', color: '#475569' }}>{t.ctaNote}</p>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ padding: '32px 24px', borderTop: '1px solid #1a2235', maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div dir="ltr" style={{ fontWeight: '700', fontSize: '14px' }}>Hayya<span style={{ color: '#D8B16A' }}> AI</span></div>
          <nav style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {['about', 'contact', 'features', 'developers', 'login'].map((k) => (
              <Link key={k} href={lp(locale, `/${k}`)} style={{ fontSize: small, color: '#64748b', textDecoration: 'none' }}>{t.foot[k]}</Link>
            ))}
            <Link href={lp(locale, '/register')} style={{ fontSize: small, color: '#D8B16A', textDecoration: 'none' }}>{t.foot.register}</Link>
            <LangSwitch locale={locale} path="/" style={{ fontSize: small }} />
          </nav>
        </div>
        <div style={{ fontSize: small, color: '#475569', marginTop: '16px', textAlign: 'center', lineHeight: '1.8' }}>
          {t.owned} <a href="https://www.hayyamed.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}><strong>{t.company}</strong></a> — {t.tagline}<br />
          {t.address}<br />
          {t.contact}: <span dir="ltr">abbas@hayyamed.ai</span> · <span dir="ltr">+974 3367 7333</span><br />
          © {new Date().getFullYear()} <span dir="ltr">Hayya AI</span>. {t.rights}
        </div>
      </footer>
    </div>
  )
}
