export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/inbox', '/contacts', '/settings', '/admin', '/clients', '/agency', '/api/'],
      },
    ],
    sitemap: 'https://hayyamed.ai/sitemap.xml',
    host: 'https://hayyamed.ai',
  }
}
