import Link from 'next/link'
import Reveal from '@/components/Reveal'
import { lp } from '@/lib/i18n'

const GOLD = '#D8B16A'
const card = { background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '14px' }

const T = {
  en: {
    portfolio: [
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
    ],
    industries: [
      ['🩺', 'Healthcare & Clinics'], ['🛍️', 'Retail & E-commerce'], ['🏘️', 'Real Estate'],
      ['🍽️', 'Hospitality & F&B'], ['💼', 'Professional Services'], ['🎓', 'Education'],
      ['💳', 'Finance & Insurance'], ['🏛️', 'Government & Public'],
    ],
    why: [
      ['⚡', 'Respond in seconds, not hours', 'AI answers every customer instantly across WhatsApp, Instagram, website and email — day or night, in Arabic and English.'],
      ['🧠', 'One platform, not six', 'Inbox, CRM, campaigns, automation and your own AI Brain — unified. Replace a stack of disconnected tools with a single system.'],
      ['🛡️', 'Qatar-built, enterprise-grade', 'Data hosted in Doha (me-central1), PDPL-aligned, with strict multi-tenant isolation and full audit logging.'],
    ],
    buildEyebrow: 'WHAT WE BUILD',
    buildH2: 'An AI studio behind your platform',
    buildP1: 'Hayya AI is the customer-engagement product of ',
    buildP2: ' — a full-stack AI & enterprise technology studio. The same team that builds Hayya AI can build the rest of your stack.',
    company: 'Hayya Med AI',
    indEyebrow: 'INDUSTRIES WE SERVE',
    indH2: 'Built for every customer-facing business',
    whyEyebrow: 'WHY HAYYA AI',
    whyH2: 'Outcomes, not just features',
    demoEyebrow: 'SEE IT ON YOUR BUSINESS',
    demoH2: 'Book a live demo',
    demoP: "We'll connect your channels, train an AI agent on your business, and show you the platform answering real customer questions — in under 20 minutes.",
    demoBtn: 'Book a demo →',
    mailSubject: 'Book a Hayya AI demo',
    mailBody: "Hi Hayya AI team, I'd like to book a demo.",
    waText: "Hi Hayya AI, I'd like to ask about the platform.",
    waBtn: 'Chat on WhatsApp',
    freeBtn: 'Or start free',
    builtBy: 'Hayya AI is built and operated by',
    doha: 'Doha, Qatar',
  },
  ar: {
    portfolio: [
      ['🌐', 'مواقع ذكية', 'مواقع مصمَّمة لرفع التحويل، مع دردشة ذكية مدمجة والتقاط بيانات العملاء المحتملين.'],
      ['☁️', 'منصات SaaS بالذكاء الاصطناعي', 'منتجات SaaS متعددة العملاء مصمَّمة للتوسّع من اليوم الأول.'],
      ['👥', 'أنظمة CRM', 'مسارات مبيعات وتقييم للعملاء المحتملين ورؤية شاملة للعميل، مؤتمتة بالكامل.'],
      ['🗂️', 'أنظمة ERP', 'العمليات والمخزون والمالية في نظام واحد متكامل.'],
      ['🤖', 'وكلاء الذكاء الاصطناعي', 'وكلاء مستقلّون مدرَّبون على بياناتك ويعملون على مدار الساعة.'],
      ['🩺', 'الذكاء الاصطناعي للرعاية الصحية', 'حلول ذكاء اصطناعي ملتزمة بالأنظمة للعيادات والتواصل مع المرضى في الخليج.'],
      ['🛒', 'الذكاء الاصطناعي للتجارة الإلكترونية', 'اكتشاف المنتجات واستعادة السلال المتروكة ودعم العملاء لزيادة الإيرادات.'],
      ['⚡', 'الأتمتة', 'أتمتة سير العمل للتخلّص من المهام اليدوية المتكررة.'],
      ['🧩', 'برمجيات مخصّصة', 'برمجيات مؤسسية تُبنى وفق متطلباتك بدقة.'],
      ['📊', 'ذكاء الأعمال', 'لوحات بيانات ومؤشرات أداء تحوّل البيانات إلى قرارات.'],
      ['🔗', 'منصات متعددة القنوات', 'واتساب وإنستغرام والموقع والبريد الإلكتروني في صندوق وارد مشترك.'],
      ['🔌', 'تكامل الذكاء الاصطناعي', 'اربط الذكاء الاصطناعي بالأدوات والأنظمة التي تعمل عليها أصلاً.'],
    ],
    industries: [
      ['🩺', 'الرعاية الصحية والعيادات'], ['🛍️', 'التجزئة والتجارة الإلكترونية'], ['🏘️', 'العقارات'],
      ['🍽️', 'الضيافة والمطاعم'], ['💼', 'الخدمات المهنية'], ['🎓', 'التعليم'],
      ['💳', 'المالية والتأمين'], ['🏛️', 'الجهات الحكومية والعامة'],
    ],
    why: [
      ['⚡', 'ردّ خلال ثوانٍ لا ساعات', 'يردّ الذكاء الاصطناعي فوراً على كل عميل عبر واتساب وإنستغرام والموقع والبريد الإلكتروني، ليلاً ونهاراً، بالعربية والإنجليزية.'],
      ['🧠', 'منصة واحدة بدلاً من ست', 'صندوق الوارد ونظام CRM والحملات والأتمتة و«عقلك الذكي» في مكان واحد، بدلاً من مجموعة أدوات منفصلة.'],
      ['🛡️', 'صُنع في قطر بمستوى المؤسسات', 'بيانات مستضافة في الدوحة (me‑central1)، متوافقة مع قانون حماية خصوصية البيانات الشخصية في قطر، مع فصل صارم بين بيانات العملاء وسجلّ تدقيق كامل.'],
    ],
    buildEyebrow: 'ماذا نبني',
    buildH2: 'استوديو ذكاء اصطناعي خلف منصتك',
    buildP1: 'Hayya AI هو منتج التواصل مع العملاء من ',
    buildP2: '، استوديو متكامل للذكاء الاصطناعي والتقنيات المؤسسية. الفريق الذي يبني Hayya AI قادر على بناء بقية أنظمتك أيضاً.',
    company: 'هيّا ميد للذكاء الاصطناعي',
    indEyebrow: 'القطاعات التي نخدمها',
    indH2: 'مصمَّم لكل نشاط يتعامل مع العملاء',
    whyEyebrow: 'لماذا Hayya AI',
    whyH2: 'نتائج ملموسة، لا مجرد ميزات',
    demoEyebrow: 'شاهده على نشاطك التجاري',
    demoH2: 'احجز عرضاً توضيحياً مباشراً',
    demoP: 'سنربط قنواتك، وندرّب وكيل ذكاء اصطناعي على نشاطك، ونريك المنصة وهي تجيب عن أسئلة عملاء حقيقية، في أقل من 20 دقيقة.',
    demoBtn: 'احجز عرضاً توضيحياً ←',
    mailSubject: 'حجز عرض توضيحي لـ Hayya AI',
    mailBody: 'مرحباً فريق Hayya AI، أودّ حجز عرض توضيحي.',
    waText: 'مرحباً Hayya AI، أودّ الاستفسار عن المنصة.',
    waBtn: 'تواصل عبر واتساب',
    freeBtn: 'أو ابدأ مجاناً',
    builtBy: 'Hayya AI من تطوير وتشغيل',
    doha: 'الدوحة، قطر',
  },
}

export default function HomeSections({ locale = 'en' }) {
  const t = T[locale] || T.en
  const ar = locale === 'ar'
  const mailto = `mailto:abbas@hayyamed.ai?subject=${encodeURIComponent(t.mailSubject)}&body=${encodeURIComponent(t.mailBody)}`
  const wa = `https://wa.me/97433677333?text=${encodeURIComponent(t.waText)}`
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
          <div style={{ fontSize: ar ? '13px' : '11px', fontWeight: 800, letterSpacing: '0.18em', color: GOLD, marginBottom: '14px' }}>{t.buildEyebrow}</div>
          <h2 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 12px' }}>{t.buildH2}</h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '620px', margin: '0 auto', lineHeight: 1.7 }}>
            {t.buildP1}<strong style={{ color: '#e2e8f0' }}>{t.company}</strong>{t.buildP2}
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginTop: '40px' }}>
          {t.portfolio.map(([icon, title, desc], i) => (
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
          <div style={{ fontSize: ar ? '13px' : '11px', fontWeight: 800, letterSpacing: '0.18em', color: GOLD, marginBottom: '12px' }}>{t.indEyebrow}</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,32px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>{t.indH2}</h2>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          {t.industries.map(([icon, name]) => (
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
            <div style={{ fontSize: ar ? '13px' : '11px', fontWeight: 800, letterSpacing: '0.18em', color: GOLD, marginBottom: '12px' }}>{t.whyEyebrow}</div>
            <h2 style={{ fontSize: 'clamp(26px,4.5vw,36px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>{t.whyH2}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {t.why.map(([icon, title, desc], i) => (
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
          <div style={{ fontSize: ar ? '13px' : '11px', fontWeight: 800, letterSpacing: '0.18em', color: GOLD, marginBottom: '14px' }}>{t.demoEyebrow}</div>
          <h2 style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 14px' }}>{t.demoH2}</h2>
          <p style={{ fontSize: '15.5px', color: '#94a3b8', lineHeight: 1.7, margin: '0 0 30px' }}>
            {t.demoP}
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={mailto} style={{ padding: '15px 32px', background: GOLD, borderRadius: '999px', color: '#070b0a', textDecoration: 'none', fontSize: '14px', fontWeight: 800, letterSpacing: '0.02em' }}>{t.demoBtn}</a>
            <a href={wa} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 28px', background: '#25D366', borderRadius: '999px', color: '#070b0a', textDecoration: 'none', fontSize: '14px', fontWeight: 800, letterSpacing: '0.02em' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm4.52 13.94c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.4 1.01 2.57.12.17 1.75 2.67 4.25 3.74.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.19.21-.58.21-1.08.14-1.19-.06-.11-.23-.17-.48-.29z" /></svg>
              {t.waBtn}
            </a>
            <Link href={lp(locale, '/register')} style={{ padding: '15px 32px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '999px', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>{t.freeBtn}</Link>
          </div>
          <p style={{ marginTop: '18px', fontSize: '12px', color: '#475569' }}>
            {t.builtBy} <strong style={{ color: '#94a3b8' }}>{t.company}</strong> · <span dir="ltr">abbas@hayyamed.ai</span> · <span dir="ltr">+974 3367 7333</span> · {t.doha}
          </p>
        </div>
      </section>
    </>
  )
}
