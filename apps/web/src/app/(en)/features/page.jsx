import FeaturesPage, { FEATURES_META } from '@/components/site/FeaturesPage'
import { alternatesFor } from '@/lib/i18n'
import { pageOpenGraph } from '@/lib/site-shell'

const { title, description } = FEATURES_META.en

export const metadata = {
  title,
  description,
  alternates: alternatesFor('en', '/features'),
  openGraph: pageOpenGraph('en', { title, description, url: '/features' }),
}

export default function Features() {
  return <FeaturesPage locale="en" />
}
