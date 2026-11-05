import DevelopersPage from '@/components/site/DevelopersPage'
import { alternatesFor } from '@/lib/i18n'
import { pageOpenGraph } from '@/lib/site-shell'

const title = 'Developer API & Webhooks — Hayya AI'
const description = 'Integrate Hayya AI: push leads via the REST API and receive real-time webhook events.'

export const metadata = {
  title,
  description,
  alternates: alternatesFor('en', '/developers'),
  openGraph: pageOpenGraph('en', { title, description, url: '/developers' }),
}

export default function Developers() {
  return <DevelopersPage locale="en" />
}
