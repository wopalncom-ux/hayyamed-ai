import { FEATURES_CONTENT } from '@/lib/features-content'

const SITE = 'https://www.hayyaai.com'

export default function sitemap() {
  const now = new Date()
  const pages = [
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
  return pages.map(p => ({ url: `${SITE}${p.path}`, lastModified: now, changeFrequency: p.changeFrequency, priority: p.priority }))
}
