import Link from 'next/link'
import { lp } from '@/lib/i18n'
import LangSwitch from '@/components/site/LangSwitch'

const LABELS = {
  en: { home: 'Home', about: 'About', contact: 'Contact', terms: 'Terms', privacy: 'Privacy', start: 'Start free' },
  ar: { home: 'الرئيسية', about: 'من نحن', contact: 'تواصل معنا', terms: 'الشروط', privacy: 'الخصوصية', start: 'ابدأ مجاناً' },
}

// Simple top bar used by the inner marketing pages (about, contact, legal…).
// `links` picks which nav items to show; `path` is the current page's English
// path, used by the language switcher.
export default function SiteHeader({ locale = 'en', path = '/', links = ['home', 'contact'], cta = true }) {
  const t = LABELS[locale] || LABELS.en
  return (
    <header style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '18px 24px', maxWidth: '1100px', margin: '0 auto', flexWrap: 'wrap' }}>
      <Link href={lp(locale, '/')} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontWeight: 900, fontSize: '18px', color: '#e2e8f0', textDecoration: 'none' }}>
        <img src="/logo.svg" alt="Hayya AI" width="28" height="28" style={{ display: 'block' }} />
        <span dir="ltr">Hayya<span style={{ color: '#D8B16A' }}> AI</span></span>
      </Link>
      <nav style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
        {links.map((k) => (
          <Link key={k} href={lp(locale, k === 'home' ? '/' : `/${k}`)} style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none' }}>{t[k]}</Link>
        ))}
        <LangSwitch locale={locale} path={path} />
        {cta && (
          <Link href={lp(locale, '/register')} style={{ fontSize: '13px', fontWeight: 700, color: '#070b0a', background: '#D8B16A', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}>{t.start}</Link>
        )}
      </nav>
    </header>
  )
}
