export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/inbox', '/contacts', '/settings', '/admin', '/clients', '/agency', '/api/'],
      },
    ],
    sitemap: 'https://www.hayyaai.com/sitemap.xml',
    host: 'https://www.hayyaai.com',
  }
}
