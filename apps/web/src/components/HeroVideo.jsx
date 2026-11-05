import HeroVideoBg from '@/components/HeroVideoBg'
import HeroMenu from '@/components/HeroMenu'
import { lp } from '@/lib/i18n'

// Brand palette
const C = { dark: '#070b0a', burgundy: '#5A1026', gold: '#D8B16A', cyan: '#5ed29c' }
const T = {
  en: {
    nav: [
      { label: 'PLATFORM', href: '#features' },
      { label: 'AI AGENTS', href: '#features' },
      { label: 'AUTOMATIONS', href: '#features' },
      { label: 'WHATSAPP', href: '/register' },
      { label: 'PRICING', href: '#pricing' },
      { label: 'ABOUT', href: '/about' },
      { label: 'CONTACT', href: '/contact' },
    ],
    start: 'Start Building',
    see: 'See Platform',
    cardTitle: 'AI Brain + ',
    cardAccent: 'Automation',
    cardBody: 'Train agents from files, websites, FAQs, CRM data, and conversations.',
    eyebrow: 'AI OPERATING PLATFORM',
    h1: 'Build. Automate. Scale with AI',
    lead: 'Launch intelligent AI agents, automate client communication, manage WhatsApp campaigns, connect your CRM, and train your own AI Brain from files, websites, and business data — all from one powerful platform.',
    menu: 'Menu', close: 'Close',
  },
  ar: {
    nav: [
      { label: 'المنصة', href: '#features' },
      { label: 'وكلاء الذكاء الاصطناعي', href: '#features' },
      { label: 'الأتمتة', href: '#features' },
      { label: 'واتساب', href: '/register' },
      { label: 'الباقات', href: '#pricing' },
      { label: 'من نحن', href: '/about' },
      { label: 'تواصل معنا', href: '/contact' },
    ],
    start: 'ابدأ الآن',
    see: 'استكشف المنصة',
    cardTitle: 'عقل ذكي + ',
    cardAccent: 'أتمتة',
    cardBody: 'درِّب وكلاءك من الملفات والمواقع والأسئلة الشائعة وبيانات CRM والمحادثات.',
    eyebrow: 'منصة تشغيل بالذكاء الاصطناعي',
    h1: 'ابنِ. أتمِت. وانمُ بالذكاء الاصطناعي',
    lead: 'أطلِق وكلاء ذكاء اصطناعي، وأتمِت تواصلك مع العملاء، وأدِر حملات واتساب، واربط نظام CRM، ودرِّب «عقلك الذكي» الخاص من ملفاتك وموقعك وبيانات عملك، كل ذلك من منصة واحدة.',
    menu: 'القائمة', close: 'إغلاق',
  },
}
const jakarta = 'var(--font-jakarta), system-ui, sans-serif'
const inter = 'var(--font-inter), system-ui, sans-serif'
const serif = 'var(--font-serif), Georgia, serif'
const Arrow = ({ flip = false }) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', transform: flip ? 'scaleX(-1)' : undefined }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>)

// Server component: all text/markup is server-rendered (SEO + perf). Only the
// HLS video and the mobile menu are interactive client islands.
export default function HeroVideo({ locale = 'en' }) {
  const t = T[locale] || T.en
  const ar = locale === 'ar'
  // In-page anchors stay as-is; page links get the locale prefix.
  const href = (h) => (h.startsWith('#') ? h : lp(locale, h))
  const nav = t.nav.map((n) => ({ ...n, href: href(n.href) }))
  return (
    <header style={{ position: 'relative', minHeight: '100svh', overflow: 'hidden', background: C.dark, color: '#fff', fontFamily: inter }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .hai-glass { position:relative; background:rgba(255,255,255,0.01); background-blend-mode:luminosity; -webkit-backdrop-filter:blur(4px); backdrop-filter:blur(4px); box-shadow:inset 0 1px 1px rgba(255,255,255,0.1); border-radius:18px; }
        .hai-glass::before { content:''; position:absolute; inset:0; padding:1.4px; border-radius:inherit; background:linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.05)); -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude; pointer-events:none; }
        .hai-gridlines{ display:none; } .hai-desktopnav{ display:none; } .hai-cta-desktop{ display:none; }
        .hai-navlink{ transition:color .2s; } .hai-navlink:hover{ color:${C.gold}!important; }
        @media (min-width:1024px){ .hai-gridlines{display:block} .hai-desktopnav{display:flex} .hai-cta-desktop{display:inline-flex} .hai-burger{display:none!important} }
      ` }} />

      {/* 1. HLS video (client island) */}
      <HeroVideoBg />

      {/* 2. Overlays */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: `linear-gradient(${ar ? '270deg' : '90deg'}, ${C.dark} 0%, rgba(7,11,10,0.55) 40%, transparent 100%)` }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: `linear-gradient(0deg, ${C.dark} 0%, rgba(7,11,10,0.55) 30%, transparent 70%)` }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: `radial-gradient(60% 50% at 50% 110%, rgba(90,16,38,0.45), transparent)`, mixBlendMode: 'screen' }} />

      {/* 3. Desktop grid lines */}
      <div className="hai-gridlines" style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        {['25%', '50%', '75%'].map(x => (<div key={x} style={{ position: 'absolute', top: 0, bottom: 0, left: x, width: '1px', background: 'rgba(255,255,255,0.10)' }} />))}
      </div>

      {/* 4. Central glow */}
      <svg aria-hidden width="1100" height="520" viewBox="0 0 1100 520" style={{ position: 'absolute', top: '-90px', left: '50%', transform: 'translateX(-50%)', zIndex: 1, pointerEvents: 'none' }}>
        <defs><filter id="hglow"><feGaussianBlur stdDeviation="25" /></filter></defs>
        <ellipse cx="550" cy="240" rx="430" ry="120" fill="rgba(94,210,156,0.30)" filter="url(#hglow)" />
        <ellipse cx="550" cy="240" rx="260" ry="70" fill="rgba(216,177,106,0.18)" filter="url(#hglow)" />
      </svg>

      {/* 7. Header */}
      <nav style={{ position: 'relative', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', maxWidth: '1280px', margin: '0 auto' }}>
        <a href={lp(locale, '/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/logo.svg" alt="Hayya AI" width="30" height="30" />
          <span dir="ltr" style={{ fontFamily: jakarta, fontWeight: 800, fontSize: '18px', letterSpacing: '0.02em', color: '#fff' }}>HAYYA<span style={{ color: C.gold }}> AI</span></span>
        </a>
        <div className="hai-desktopnav" style={{ gap: '28px', alignItems: 'center' }}>
          {nav.map(n => (<a key={n.label} href={n.href} className="hai-navlink" style={{ fontFamily: jakarta, fontWeight: 700, fontSize: ar ? '13px' : '11px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{n.label}</a>))}
          <a href={lp(ar ? 'en' : 'ar', '/')} hrefLang={ar ? 'en' : 'ar'} lang={ar ? 'en' : 'ar'} className="hai-navlink" style={{ fontFamily: jakarta, fontWeight: 700, fontSize: ar ? '12px' : '13px', letterSpacing: ar ? '0.12em' : 0, color: C.gold, textDecoration: 'none' }}>{ar ? 'ENGLISH' : 'العربية'}</a>
        </div>
        <a href={lp(locale, '/register')} className="hai-cta-desktop" style={{ fontFamily: jakarta, fontWeight: 800, fontSize: ar ? '13px' : '11px', letterSpacing: '0.1em', textTransform: 'uppercase', background: C.gold, color: C.dark, padding: '10px 18px', borderRadius: '999px', textDecoration: 'none' }}>{t.start}</a>
        <HeroMenu nav={nav} locale={locale} startLabel={t.start} menuLabel={t.menu} closeLabel={t.close} />
      </nav>

      {/* Hero content */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1280px', margin: '0 auto', padding: '40px 24px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: 'calc(100svh - 86px)', justifyContent: 'center' }}>

        {/* 5. Liquid glass card */}
        <div className="hai-glass" style={{ width: '200px', height: '200px', transform: 'translateY(-50px)', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'start' }}>
          <div style={{ fontFamily: jakarta, fontWeight: 700, fontSize: '10px', letterSpacing: '0.2em', color: C.cyan }}>[ 2026 ]</div>
          <div>
            <div style={{ fontFamily: inter, fontWeight: 700, fontSize: '15px', lineHeight: 1.25, color: '#fff' }}>{t.cardTitle}<span style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: ar ? 700 : 400, color: C.gold, fontSize: ar ? '15px' : '18px' }}>{t.cardAccent}</span></div>
            <div style={{ fontFamily: inter, fontSize: ar ? '11.5px' : '10.5px', lineHeight: 1.5, color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>{t.cardBody}</div>
          </div>
        </div>

        <div style={{ fontFamily: jakarta, fontWeight: 700, fontSize: ar ? '14px' : '11px', letterSpacing: '0.22em', color: C.cyan, marginBottom: '18px' }}>{t.eyebrow}</div>

        <h1 style={{ fontFamily: inter, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1.02, fontSize: ar ? 'clamp(36px, 7vw, 64px)' : 'clamp(40px, 8vw, 72px)', margin: '0 0 22px', maxWidth: ar ? '16ch' : '14ch' }}>
          {t.h1}<span style={{ color: C.gold }}>.</span>
        </h1>

        <p style={{ fontFamily: inter, fontSize: ar ? '16px' : '14px', lineHeight: 1.8, color: 'rgba(255,255,255,0.7)', maxWidth: '560px', margin: '0 0 32px' }}>
          {t.lead}
        </p>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href={lp(locale, '/register')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: jakarta, fontWeight: 800, fontSize: ar ? '14px' : '12px', letterSpacing: '0.08em', textTransform: 'uppercase', background: C.gold, color: C.dark, padding: '14px 26px', borderRadius: '999px', textDecoration: 'none' }}>{t.start} <Arrow flip={ar} /></a>
          <a href="#features" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: jakarta, fontWeight: 700, fontSize: ar ? '14px' : '12px', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '14px 26px', borderRadius: '999px', textDecoration: 'none' }}>{t.see}</a>
        </div>
      </div>
    </header>
  )
}
