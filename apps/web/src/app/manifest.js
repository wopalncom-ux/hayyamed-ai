export default function manifest() {
  return {
    name: 'Hayya AI — Business Operating System',
    short_name: 'Hayya AI',
    description: 'AI-powered CRM, automation, and omnichannel Business Operating System.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#07090f',
    theme_color: '#00e5a0',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }
}
