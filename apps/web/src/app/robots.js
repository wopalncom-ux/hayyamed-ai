import { SITE } from '@/lib/i18n'

// Public marketing pages (English and Arabic) are open to every crawler,
// including AI answer engines; the signed-in app and the API are not.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/inbox', '/contacts', '/settings', '/admin', '/clients', '/agency', '/api/'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
