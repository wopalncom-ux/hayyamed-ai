import Link from 'next/link'
import PricingSection from '@/components/PricingSection'

export const metadata = {
  title: 'Hayyamed AI — AI-Powered CRM for Qatar & GCC',
  description: 'WhatsApp, Instagram, Facebook and Email omnichannel CRM with AI agents, automated replies, lead scoring, and campaign management. Built for Qatar and GCC businesses.',
  openGraph: {
    title: 'Hayyamed AI — AI-Powered CRM for Qatar & GCC',
    description: 'Automate customer conversations with AI. Manage leads, campaigns, and bookings across WhatsApp, Instagram, and email.',
    type: 'website',
  },
}

const FEATURES = [
  {
    icon: '💬',
    title: 'Omnichannel Inbox',
    desc: 'WhatsApp, Instagram, Facebook, Telegram, Email — one unified inbox. Never miss a message again.',
    color: '#00e5a0',
  },
  {
    icon: '🤖',
    title: 'AI Auto-Reply',
    desc: 'AI agents respond instantly in Arabic and English. Qualify leads, answer questions, and book appointments 24/7.',
    color: '#a78bfa',
  },
  {
    icon: '📊',
    title: 'CRM & Lead Scoring',
    desc: 'AI scores every lead 0-100. Track contacts, conversations, and deal stages with full visibility.',
    color: '#3b82f6',
  },
  {
    icon: '📣',
    title: 'Bulk Campaigns',
    desc: 'Send WhatsApp and email campaigns to thousands. AI generates the copy. You just set the audience.',
    color: '#f97316',
  },
  {
    icon: '⚡',
    title: 'Automation Builder',
    desc: 'Build visual workflow automations. Trigger → Condition → AI Reply → Tag → Book — without code.',
    color: '#fbbf24',
  },
  {
    icon: '📅',
    title: 'Booking System',
    desc: 'Built-in appointment booking. Clients book via chat, you confirm in one click. Calendar sync included.',
    color: '#06b6d4',
  },
]

const CHANNELS = [
  { icon: '💬', name: 'WhatsApp', color: '#00e5a0' },
  { icon: '📸', name: 'Instagram', color: '#ec4899' },
  { icon: '👤', name: 'Facebook', color: '#3b82f6' },
  { icon: '📧', name: 'Email', color: '#fbbf24' },
  { icon: '✈️', name: 'Telegram', color: '#f97316' },
  { icon: '💻', name: 'Web Chat', color: '#06b6d4' },
]

// Prices are owner-editable in /admin/pricing and fetched live below; these are fallbacks.
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'QAR 150',
    period: '/month',
    color: '#3b82f6',
    features: ['10,000 messages/mo', '5,000 AI responses', '1,000 contacts', '5 team members'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 'QAR 599',
    period: '/month',
    color: '#00e5a0',
    popular: true,
    features: ['50,000 messages/mo', '20,000 AI responses', '5,000 contacts', '15 team members', 'Advanced AI agent'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'QAR 990',
    period: '/month',
    color: '#a78bfa',
    features: ['Unlimited everything', 'Dedicated AI agent', 'White-label option', 'Priority support', 'Custom integrations'],
  },
]

const STATS = [
  { value: '6+', label: 'Channels Connected' },
  { value: '24/7', label: 'AI Auto-Reply' },
  { value: '4', label: 'AI Providers' },
  { value: 'QAR', label: 'Qatar-Priced Plans' },
]

export default function LandingPage() {
  return (
    <div style={{ background: '#07090f', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh' }}>

      {/* ─── Nav ────────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(7,9,15,.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(26,34,53,.8)', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: '900', fontSize: '20px', letterSpacing: '-0.02em' }}>
          Hayya<span style={{ color: '#00e5a0' }}>med</span> <span style={{ color: '#64748b', fontWeight: '400', fontSize: '16px' }}>AI</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href="/login" style={{ padding: '8px 18px', background: 'none', border: '1px solid #1a2235', borderRadius: '6px', color: '#94a3b8', textDecoration: 'none', fontSize: '13px' }}>
            Log in
          </Link>
          <Link href="/register" style={{ padding: '8px 20px', background: '#00e5a0', borderRadius: '6px', color: '#07090f', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>
            Start Free →
          </Link>
        </div>
      </nav>

      {/* ─── Hero ───────────────────────────────────────────────────── */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 24px 64px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '5px 14px', background: 'rgba(0,229,160,.08)', border: '1px solid rgba(0,229,160,.2)', borderRadius: '20px', fontSize: '11px', color: '#00e5a0', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '24px' }}>
          🇶🇦 BUILT FOR QATAR &amp; GCC BUSINESSES
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: '900', lineHeight: '1.12', letterSpacing: '-0.03em', marginBottom: '20px', background: 'linear-gradient(135deg, #e2e8f0 30%, #00e5a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Your AI Sales Team,<br />Active 24/7 on WhatsApp
        </h1>
        <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: '1.65', maxWidth: '600px', margin: '0 auto 36px', fontWeight: '400' }}>
          One inbox for all channels. AI replies instantly in Arabic &amp; English.
          Qualify leads, book appointments, and run campaigns — all automated.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{ padding: '14px 32px', background: '#00e5a0', borderRadius: '8px', color: '#07090f', textDecoration: 'none', fontSize: '15px', fontWeight: '800', letterSpacing: '-0.01em' }}>
            Start Free — Setup in 5 min →
          </Link>
          <Link href="/login" style={{ padding: '14px 24px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '8px', color: '#e2e8f0', textDecoration: 'none', fontSize: '15px' }}>
            View Demo
          </Link>
        </div>
        <p style={{ marginTop: '14px', fontSize: '11px', color: '#475569' }}>No credit card required · Qatar data residency · PDPL compliant</p>
      </section>

      {/* ─── Channel badges ─────────────────────────────────────────── */}
      <section style={{ maxWidth: '700px', margin: '0 auto 80px', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: '#475569', letterSpacing: '0.08em', marginBottom: '16px', fontWeight: '700' }}>CONNECT ALL YOUR CHANNELS</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {CHANNELS.map(ch => (
            <div key={ch.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '24px', fontSize: '12px', fontWeight: '600' }}>
              <span>{ch.icon}</span>
              <span style={{ color: ch.color }}>{ch.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Stats row ──────────────────────────────────────────────── */}
      <section style={{ background: '#0c0f1a', borderTop: '1px solid #1a2235', borderBottom: '1px solid #1a2235', padding: '32px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', textAlign: 'center' }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#00e5a0' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────────── */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '12px' }}>Everything your team needs</h2>
          <p style={{ fontSize: '16px', color: '#94a3b8' }}>Replace 6 tools with one platform. Built specifically for the GCC market.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ padding: '24px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '10px', borderLeft: `3px solid ${f.color}` }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.icon}</div>
              <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '8px', color: '#e2e8f0' }}>{f.title}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ───────────────────────────────────────────── */}
      <section style={{ background: '#0c0f1a', borderTop: '1px solid #1a2235', borderBottom: '1px solid #1a2235', padding: '80px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '48px' }}>Up and running in 5 minutes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' }}>
            {[
              { step: '1', title: 'Create your account', desc: 'Sign up and complete the 5-step onboarding wizard.' },
              { step: '2', title: 'Connect your channels', desc: 'Add your WhatsApp Business API, Instagram, and email.' },
              { step: '3', title: 'Activate your AI agent', desc: 'Your AI starts replying to customers immediately.' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,229,160,.08)', border: '2px solid rgba(0,229,160,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '18px', fontWeight: '900', color: '#00e5a0' }}>{s.step}</div>
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '6px' }}>{s.title}</div>
                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing (live, owner-editable) ─────────────────────────── */}
      <PricingSection />

      {/* ─── Final CTA ──────────────────────────────────────────────── */}
      <section style={{ background: '#0c0f1a', borderTop: '1px solid #1a2235', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '12px' }}>Start automating your business today</h2>
        <p style={{ fontSize: '15px', color: '#94a3b8', marginBottom: '28px' }}>Join Qatar businesses using AI to respond faster, convert more leads, and grow revenue.</p>
        <Link href="/register" style={{ display: 'inline-block', padding: '14px 36px', background: '#00e5a0', borderRadius: '8px', color: '#07090f', textDecoration: 'none', fontSize: '15px', fontWeight: '800', letterSpacing: '-0.01em' }}>
          Create your free account →
        </Link>
        <p style={{ marginTop: '14px', fontSize: '11px', color: '#475569' }}>Data stored in Qatar · me-central1 (Doha) · PDPL compliant</p>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ padding: '32px 24px', borderTop: '1px solid #1a2235', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ fontWeight: '700', fontSize: '14px' }}>Hayya<span style={{ color: '#00e5a0' }}>med</span> AI</div>
        <div style={{ fontSize: '11px', color: '#475569' }}>© {new Date().getFullYear()} Hayyamed AI. All rights reserved. Qatar.</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/login" style={{ fontSize: '11px', color: '#64748b', textDecoration: 'none' }}>Log in</Link>
          <Link href="/register" style={{ fontSize: '11px', color: '#00e5a0', textDecoration: 'none' }}>Sign up free</Link>
        </div>
      </footer>
    </div>
  )
}
