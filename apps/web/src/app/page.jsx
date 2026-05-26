import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Hayyamed AI',
  description: 'AI-powered CRM for Qatar',
}

export default function Page() {
  redirect('/dashboard')
}
