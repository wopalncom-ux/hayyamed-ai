import { FEATURES_CONTENT } from '@/lib/features-content'
import { SITE, lp } from '@/lib/i18n'

// Every public page exists in English (root) and Arabic (/ar). Each URL is
// listed once per language, and each entry carries hreflang alternates so
// search engines connect the two versions.
const PAGES = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/features', priority: 0.9, changeFrequency: 'weekly' },
  ...FEATURES_CONTENT.map((f) => ({ path: `/features/${f.slug}`, priority: 0.75, changeFrequency: 'monthly' })),
  { path: '/developers', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/register', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
]

const url = (locale, path) => {
  const p = lp(locale, path)
  return p === '/' ? SITE : `${SITE}${p}`
}

export default function sitemap() {
  const now = new Date()
  return PAGES.flatMap((p) => ['en', 'ar'].map((locale) => ({
    url: url(locale, p.path),
    lastModified: now,
    changeFrequency: p.changeFrequency,
    // Arabic is the second language; keep it just below its English twin.
    priority: locale === 'en' ? p.priority : Math.round(p.priority * 0.9 * 100) / 100,
    alternates: { languages: { en: url('en', p.path), ar: url('ar', p.path), 'x-default': url('en', p.path) } },
  })))
}
