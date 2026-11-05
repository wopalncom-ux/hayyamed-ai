import AboutPage from '@/components/site/AboutPage'
import { alternatesFor } from '@/lib/i18n'
import { pageOpenGraph } from '@/lib/site-shell'

const title = 'About — Built & operated by Hayya Med AI'
const description = 'Hayya AI is built and operated by Hayya Med AI, an Artificial Intelligence Solutions & Enterprise Technology company in Doha, Qatar. Founded by Abbas Al Masri. Qatar-Born, GCC-Proven, Globally Ready.'

export const metadata = {
  title,
  description,
  alternates: alternatesFor('en', '/about'),
  openGraph: pageOpenGraph('en', { title, description, url: '/about' }),
}

export default function About() {
  return <AboutPage locale="en" />
}
