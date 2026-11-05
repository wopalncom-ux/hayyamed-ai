import FeaturesPage, { FEATURES_META } from '@/components/site/FeaturesPage'
import { alternatesFor } from '@/lib/i18n'
import { pageOpenGraph } from '@/lib/site-shell'

const { title, description } = FEATURES_META.ar

export const metadata = {
  title,
  description,
  alternates: alternatesFor('ar', '/features'),
  openGraph: pageOpenGraph('ar', { title, description, url: '/ar/features' }),
}

export default function Features() {
  return <FeaturesPage locale="ar" />
}
