import { lp } from '@/lib/i18n'

// Link to the same page in the other language. `path` is the English path
// of the current page (e.g. "/about"). hrefLang/lang help crawlers and
// screen readers; the label is always written in the target language.
export default function LangSwitch({ locale, path = '/', style }) {
  const target = locale === 'ar' ? 'en' : 'ar'
  return (
    <a
      href={lp(target, path)}
      hrefLang={target}
      lang={target}
      style={{ fontSize: '13px', fontWeight: 700, color: '#D8B16A', textDecoration: 'none', whiteSpace: 'nowrap', ...style }}
    >
      {target === 'ar' ? 'العربية' : 'English'}
    </a>
  )
}
