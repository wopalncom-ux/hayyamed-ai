import { notFound } from 'next/navigation'
import FeatureDetailPage, { featureMetadata } from '@/components/site/FeatureDetailPage'
import { FEATURES_CONTENT } from '@/lib/features-content'
import { alternatesFor } from '@/lib/i18n'
import { pageOpenGraph } from '@/lib/site-shell'

export function generateStaticParams() {
  return FEATURES_CONTENT.map((f) => ({ slug: f.slug }))
}

// Only the known feature slugs exist; anything else is a 404.
export const dynamicParams = false

export async function generateMetadata({ params }) {
  const { slug } = await params
  const m = featureMetadata(slug, 'en')
  if (!m) return {}
  const path = `/features/${m.feature.slug}`
  return {
    title: m.title,
    description: m.description,
    alternates: alternatesFor('en', path),
    openGraph: pageOpenGraph('en', { title: m.title, description: m.description, url: '' + path }),
  }
}

export default async function FeatureDetail({ params }) {
  const { slug } = await params
  if (!featureMetadata(slug, 'en')) notFound()
  return <FeatureDetailPage slug={slug} locale="en" />
}
