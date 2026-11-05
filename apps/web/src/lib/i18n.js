// Locale helpers for the public marketing site.
// English is the primary language and lives at the root ("/about").
// Arabic is the second language and lives under "/ar" ("/ar/about").

export const SITE = 'https://hayyamed.ai'
export const LOCALES = ['en', 'ar']
export const DEFAULT_LOCALE = 'en'

/** Path for `path` (an English path such as "/about") in `locale`. */
export function lp(locale, path = '/') {
  if (locale !== 'ar') return path
  return path === '/' ? '/ar' : `/ar${path}`
}

/** English path for any localized pathname ("/ar/about" -> "/about"). */
export function stripLocale(pathname = '/') {
  if (pathname === '/ar') return '/'
  if (pathname.startsWith('/ar/')) return pathname.slice(3)
  return pathname
}

export function localeOf(pathname = '/') {
  return pathname === '/ar' || pathname.startsWith('/ar/') ? 'ar' : 'en'
}

/**
 * Metadata `alternates` for a page that exists in both languages:
 * a self-referencing canonical plus hreflang links (en, ar, x-default).
 */
export function alternatesFor(locale, path) {
  return {
    canonical: lp(locale, path),
    languages: { en: path, ar: lp('ar', path), 'x-default': path },
  }
}

export const isAr = (locale) => locale === 'ar'
export const dirOf = (locale) => (locale === 'ar' ? 'rtl' : 'ltr')

/** Forward arrow that points the reading direction ("→" in English, "←" in Arabic). */
export const arrow = (locale) => (locale === 'ar' ? '←' : '→')
