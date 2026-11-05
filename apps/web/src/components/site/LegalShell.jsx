import SiteHeader from '@/components/site/SiteHeader'
import { lp } from '@/lib/i18n'

const wrap = { maxWidth: '820px', margin: '0 auto', padding: '0 24px' }

export const legalStyles = {
  h2: { fontSize: '18px', fontWeight: 800, margin: '36px 0 12px', color: '#e2e8f0' },
  p: { fontSize: '14px', color: '#94a3b8', lineHeight: 1.8, margin: '0 0 14px' },
  li: { fontSize: '14px', color: '#94a3b8', lineHeight: 1.8, marginBottom: '8px' },
  ul: { paddingInlineStart: '20px', margin: '0 0 14px' },
  strong: { color: '#e2e8f0' },
  a: { color: '#D8B16A' },
}

const T = {
  en: { badge: 'LEGAL', updated: 'Last updated: October 1, 2026' },
  ar: {
    badge: 'قانوني',
    updated: 'آخر تحديث: 1 أكتوبر 2026',
    notice: 'هذه ترجمة عربية للنص الإنجليزي لتيسير الاطلاع عليه. في حال وجود أي اختلاف أو تعارض بين النسختين، تكون النسخة الإنجليزية هي المعتمدة.',
    english: 'اقرأ النسخة الإنجليزية',
  },
}

// Shared frame for the Privacy Policy and Terms of Service pages.
export default function LegalShell({ locale = 'en', path, title, otherLink, children }) {
  const t = T[locale] || T.en
  const ar = locale === 'ar'
  return (
    <div style={{ background: '#070b0a', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', overflowX: 'hidden' }}>
      <SiteHeader locale={locale} path={path} links={['home', otherLink, 'contact']} cta={false} />

      <section style={{ textAlign: 'center', padding: '56px 24px 24px' }}>
        <div style={{ display: 'inline-block', fontSize: ar ? '13px' : '11px', fontWeight: 800, letterSpacing: '0.14em', color: '#D8B16A', border: '1px solid rgba(216,177,106,.3)', borderRadius: '999px', padding: '6px 14px', marginBottom: '20px' }}>{t.badge}</div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 10px' }}>{title}</h1>
        <p style={{ fontSize: '13px', color: '#64748b' }}>{t.updated}</p>
      </section>

      <section style={{ ...wrap, paddingBottom: '80px' }}>
        {ar && (
          <p style={{ ...legalStyles.p, background: 'rgba(216,177,106,.06)', border: '1px solid rgba(216,177,106,.25)', borderRadius: '10px', padding: '14px 16px', marginBottom: '28px' }}>
            {t.notice} <a href={lp('en', path)} hrefLang="en" style={legalStyles.a}>{t.english}</a>
          </p>
        )}
        {children}
      </section>
    </div>
  )
}
