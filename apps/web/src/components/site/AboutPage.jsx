import Link from 'next/link'
import Reveal from '@/components/Reveal'
import AiBackdrop from '@/components/AiBackdrop'
import SiteHeader from '@/components/site/SiteHeader'
import CompanyFooter from '@/components/site/CompanyFooter'
import { lp } from '@/lib/i18n'

const wrap = { maxWidth: '900px', margin: '0 auto', padding: '0 24px' }
const card = { background: '#0f1520', border: '1px solid #1a2235', borderRadius: '16px', padding: '28px' }

const T = {
  en: {
    badge: 'BUILT & OPERATED BY HAYYA MED AI',
    h1a: 'We build the ', h1ai: 'AI', h1b: ' that runs your customer conversations',
    lead: (s) => (<>Hayya AI is the customer-engagement platform from <strong style={s}>Hayya Med AI</strong> — an Artificial Intelligence Solutions &amp; Enterprise Technology company, born in Doha with a global vision.</>),
    motto: ['🇶🇦 QATAR-BORN', '· GCC-PROVEN ·', 'GLOBALLY READY'],
    stats: [['4', 'Channels — WhatsApp, Instagram, Web chat, Email'], ['24/7', 'AI agents that never sleep'], ['100%', 'Data hosted in Qatar'], ['2025', 'Founded in Doha']],
    whyH2: 'Why we exist',
    why1: 'Hayya Med AI was established in Doha, Qatar to bridge a gap: world-class AI was reaching global enterprises, but not the businesses around us. We design and build AI-powered platforms, enterprise software and automation that any business — a clinic, a retailer, a service company — can put to work in minutes.',
    why2: (s) => (<><strong style={s}>Hayya AI</strong> is that vision made real for customer engagement: an AI agent that answers WhatsApp and Instagram instantly, trained on your own business, with your team one tap away.</>),
    buildH2: 'What we build',
    build: [
      ['🤖', 'AI Agents', 'Trained on your content, answering across channels 24/7 in Arabic & English.'],
      ['💬', 'Omnichannel Inbox', 'WhatsApp, Instagram and website chat in one shared inbox with human takeover.'],
      ['⚡', 'Automation & CRM', 'Lead capture, follow-ups, pipeline and reporting — automated end to end.'],
    ],
    coH2: 'About Hayya Med AI',
    coP: (s) => (<><strong style={s}>Hayya Med Artificial Intelligence</strong> is an Artificial Intelligence Solutions &amp; Enterprise Technology company headquartered in Doha, Qatar. Our mission is to empower organizations through artificial intelligence, intelligent automation, and innovative technology solutions that transform challenges into opportunities and ideas into scalable digital ecosystems.</>),
    facts: [['Legal Name', 'Hayya Med Artificial Intelligence'], ['Founded', 'June 2025 · Doha, Qatar'], ['Commercial Registration', '219050'], ['Website', 'hayyamed.ai']],
    visit: 'Visit hayyamed.ai ↗',
    founderLabel: 'FOUNDER',
    founderName: 'Abbas Al Masri',
    founderRole: 'Founder & Chief Executive Officer, Hayya Med AI',
    founderBio: 'A business leader with executive experience across healthcare and technology, Abbas founded Hayya Med AI in Doha, Qatar to bring practical, enterprise-grade AI to businesses in the GCC and beyond — starting with the conversations that win and keep customers.',
    address: 'Zone 6, Street 970, Grand Hamad St, Building 2, 3rd Floor, Tejwaans Business Center, Doha, Qatar · P.O. Box 20278',
    ctaH2: 'Put an AI agent on your business',
    ctaP: 'WhatsApp, Instagram and web — answering instantly, trained on you.',
    ctaBtn: 'Create your free account →',
  },
  ar: {
    badge: 'من تطوير وتشغيل هيّا ميد للذكاء الاصطناعي',
    h1a: 'نبني ', h1ai: 'الذكاء الاصطناعي', h1b: ' الذي يدير محادثات عملائك',
    lead: (s) => (<>Hayya AI منصة التواصل مع العملاء من <strong style={s}>هيّا ميد للذكاء الاصطناعي</strong>، الشركة المتخصصة في حلول الذكاء الاصطناعي والتقنيات المؤسسية، التي وُلدت في الدوحة برؤية عالمية.</>),
    motto: ['🇶🇦 وُلدت في قطر', '· أثبتت جدارتها في الخليج ·', 'جاهزة للعالم'],
    stats: [['4', 'قنوات: واتساب وإنستغرام ودردشة الموقع والبريد الإلكتروني'], ['24/7', 'وكلاء ذكاء اصطناعي لا يتوقفون'], ['100%', 'بيانات مستضافة في قطر'], ['2025', 'سنة التأسيس في الدوحة']],
    whyH2: 'لماذا وُجدنا',
    why1: 'تأسست هيّا ميد للذكاء الاصطناعي في الدوحة، قطر، لسدّ فجوة واضحة: كان الذكاء الاصطناعي المتقدّم يصل إلى المؤسسات العالمية الكبرى، لكنه لم يصل إلى الشركات من حولنا. نصمّم ونبني منصات مدعومة بالذكاء الاصطناعي وبرمجيات مؤسسية وحلول أتمتة يمكن لأي نشاط، سواء كان عيادة أو متجراً أو شركة خدمات، أن يبدأ باستخدامها خلال دقائق.',
    why2: (s) => (<><strong style={s}>Hayya AI</strong> هو تحقيق هذه الرؤية في مجال التواصل مع العملاء: وكيل ذكاء اصطناعي يردّ فوراً على واتساب وإنستغرام، مدرَّب على نشاطك التجاري، وفريقك على بُعد نقرة واحدة.</>),
    buildH2: 'ماذا نبني',
    build: [
      ['🤖', 'وكلاء الذكاء الاصطناعي', 'مدرَّبون على محتواك، ويردّون عبر كل القنوات على مدار الساعة بالعربية والإنجليزية.'],
      ['💬', 'صندوق الوارد الموحّد', 'واتساب وإنستغرام ودردشة الموقع في صندوق وارد مشترك، مع إمكانية تدخّل الموظف في أي وقت.'],
      ['⚡', 'الأتمتة ونظام CRM', 'التقاط العملاء المحتملين والمتابعة ومسار المبيعات والتقارير، مؤتمتة بالكامل.'],
    ],
    coH2: 'عن هيّا ميد للذكاء الاصطناعي',
    coP: (s) => (<><strong style={s}>هيّا ميد للذكاء الاصطناعي</strong> (Hayya Med Artificial Intelligence) شركة متخصصة في حلول الذكاء الاصطناعي والتقنيات المؤسسية، ومقرها الدوحة، قطر. مهمتنا تمكين المؤسسات بالذكاء الاصطناعي والأتمتة الذكية والحلول التقنية المبتكرة التي تحوّل التحديات إلى فرص، والأفكار إلى منظومات رقمية قابلة للتوسّع.</>),
    facts: [['الاسم القانوني', 'Hayya Med Artificial Intelligence'], ['التأسيس', 'يونيو 2025 · الدوحة، قطر'], ['السجل التجاري', '219050'], ['الموقع الإلكتروني', 'hayyamed.ai']],
    visit: 'زُر hayyamed.ai ↗',
    founderLabel: 'المؤسس',
    founderName: 'عباس المصري',
    founderRole: 'المؤسس والرئيس التنفيذي، هيّا ميد للذكاء الاصطناعي',
    founderBio: 'قائد أعمال يمتلك خبرة تنفيذية في قطاعي الرعاية الصحية والتكنولوجيا، أسّس عباس شركة هيّا ميد للذكاء الاصطناعي في الدوحة، قطر، ليقدّم ذكاءً اصطناعياً عملياً بمستوى المؤسسات للشركات في دول الخليج وخارجها، بدءاً بالمحادثات التي تكسب العملاء وتحافظ عليهم.',
    address: 'المنطقة 6، الشارع 970، شارع حمد الكبير، المبنى 2، الطابق الثالث، مركز Tejwaans للأعمال، الدوحة، قطر · ص.ب. 20278',
    ctaH2: 'ضع وكيل ذكاء اصطناعي في خدمة نشاطك',
    ctaP: 'واتساب وإنستغرام والموقع، ردود فورية من وكيل مدرَّب على نشاطك.',
    ctaBtn: 'أنشئ حسابك المجاني ←',
  },
}

export default function AboutPage({ locale = 'en' }) {
  const t = T[locale] || T.en
  const ar = locale === 'ar'
  const strong = { color: '#e2e8f0' }
  return (
    <div style={{ background: '#070b0a', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', overflowX: 'hidden' }}>
      <SiteHeader locale={locale} path="/about" links={['home', 'contact']} />

      {/* Hero */}
      <section style={{ position: 'relative', textAlign: 'center', padding: '72px 24px 56px' }}>
        <AiBackdrop />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', fontSize: ar ? '13px' : '11px', fontWeight: 800, letterSpacing: '0.14em', color: '#D8B16A', border: '1px solid rgba(216,177,106,.3)', borderRadius: '999px', padding: '6px 14px', marginBottom: '22px' }}>{t.badge}</div>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 18px' }}>
            {t.h1a}<span className="hai-shimmer">{t.h1ai}</span>{t.h1b}
          </h1>
          <p style={{ fontSize: '17px', color: '#94a3b8', lineHeight: 1.7, maxWidth: '640px', margin: '0 auto' }}>{t.lead(strong)}</p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px', fontSize: ar ? '13px' : '12px', fontWeight: 700, letterSpacing: '0.05em', color: '#64748b' }}>
            {t.motto.map((m) => <span key={m}>{m}</span>)}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ ...wrap, marginBottom: '64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
          {t.stats.map(([n, l], i) => (
            <Reveal key={l} delay={i * 90} style={{ ...card, textAlign: 'center', padding: '22px 16px' }}>
              <div dir="ltr" style={{ fontSize: '30px', fontWeight: 900, color: '#D8B16A' }}>{n}</div>
              <div style={{ fontSize: ar ? '13px' : '12px', color: '#64748b', marginTop: '6px', lineHeight: 1.5 }}>{l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Story + Mission */}
      <section style={{ ...wrap, marginBottom: '56px' }}>
        <Reveal style={card}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 14px' }}>{t.whyH2}</h2>
          <p style={{ fontSize: ar ? '16px' : '15px', color: '#94a3b8', lineHeight: 1.85, margin: '0 0 14px' }}>{t.why1}</p>
          <p style={{ fontSize: ar ? '16px' : '15px', color: '#94a3b8', lineHeight: 1.85, margin: 0 }}>{t.why2(strong)}</p>
        </Reveal>
      </section>

      {/* What we do */}
      <section style={{ ...wrap, marginBottom: '56px' }}>
        <Reveal><h2 style={{ fontSize: '24px', fontWeight: 800, textAlign: 'center', margin: '0 0 22px' }}>{t.buildH2}</h2></Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {t.build.map(([icon, title, desc], i) => (
            <Reveal key={title} delay={i * 90} style={card}>
              <div style={{ fontSize: '26px', marginBottom: '10px' }}>{icon}</div>
              <h3 style={{ fontWeight: 800, fontSize: ar ? '16px' : '15px', margin: '0 0 6px' }}>{title}</h3>
              <div style={{ fontSize: ar ? '14px' : '13px', color: '#64748b', lineHeight: 1.6 }}>{desc}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* About Hayya Med AI */}
      <section style={{ ...wrap, marginBottom: '56px' }}>
        <Reveal style={card}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 14px' }}>{t.coH2}</h2>
          <p style={{ fontSize: ar ? '16px' : '15px', color: '#94a3b8', lineHeight: 1.85, margin: '0 0 20px' }}>{t.coP(strong)}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
            {t.facts.map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: ar ? '12px' : '10px', fontWeight: 800, letterSpacing: '0.1em', color: '#D8B16A', marginBottom: '4px', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#e2e8f0' }}>{value}</div>
              </div>
            ))}
          </div>
          <a href="https://www.hayyamed.ai" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '20px', fontSize: '13px', fontWeight: 700, color: '#D8B16A', textDecoration: 'none' }}>{t.visit}</a>
        </Reveal>
      </section>

      {/* Founder */}
      <section style={{ ...wrap, marginBottom: '64px' }}>
        <Reveal style={{ ...card, display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div dir="ltr" style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg,#D8B16A,#5A1026)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', fontWeight: 900, color: '#fff', flexShrink: 0 }}>AA</div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ fontSize: ar ? '13px' : '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#D8B16A', marginBottom: '6px' }}>{t.founderLabel}</div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 4px' }}>{t.founderName}</h2>
            <div style={{ fontSize: ar ? '14px' : '13px', color: '#94a3b8', marginBottom: '12px' }}>{t.founderRole}</div>
            <p style={{ fontSize: ar ? '15px' : '14px', color: '#94a3b8', lineHeight: 1.8, margin: 0 }}>{t.founderBio}</p>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.8, margin: '12px 0 0' }}>
              {t.address}<br />
              <a href="mailto:abbas@hayyamed.ai" style={{ color: '#94a3b8', textDecoration: 'none' }}><span dir="ltr">abbas@hayyamed.ai</span></a>
            </p>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section style={{ position: 'relative', textAlign: 'center', padding: '72px 24px', borderTop: '1px solid #1a2235', background: '#0c0f1a' }}>
        <Reveal>
          <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 12px' }}>{t.ctaH2}</h2>
          <p style={{ fontSize: ar ? '16px' : '15px', color: '#94a3b8', margin: '0 0 24px' }}>{t.ctaP}</p>
          <Link href={lp(locale, '/register')} style={{ display: 'inline-block', padding: '14px 36px', background: '#D8B16A', borderRadius: '8px', color: '#070b0a', textDecoration: 'none', fontSize: '15px', fontWeight: 800 }}>{t.ctaBtn}</Link>
        </Reveal>
      </section>

      <CompanyFooter locale={locale} />
    </div>
  )
}
