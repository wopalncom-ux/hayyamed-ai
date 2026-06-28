const SITE = 'https://www.hayyaai.com'

export default function sitemap() {
  const now = new Date()
  const pages = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/developers', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/register', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/login', priority: 0.4, changeFrequency: 'yearly' },
  ]
  return pages.map(p => ({ url: `${SITE}${p.path}`, lastModified: now, changeFrequency: p.changeFrequency, priority: p.priority }))
}
