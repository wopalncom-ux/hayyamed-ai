import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — Hayya AI',
  description: 'Terms of Service for Hayya AI, operated by Hayya Med Artificial Intelligence.',
  alternates: { canonical: '/terms' },
}

const wrap = { maxWidth: '820px', margin: '0 auto', padding: '0 24px' }
const h2 = { fontSize: '18px', fontWeight: 800, margin: '36px 0 12px', color: '#e2e8f0' }
const p = { fontSize: '14px', color: '#94a3b8', lineHeight: 1.8, margin: '0 0 14px' }

export default function Terms() {
  return (
    <div style={{ background: '#070b0a', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', overflowX: 'hidden' }}>
      <header style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', fontWeight: 900, fontSize: '18px', color: '#e2e8f0', textDecoration: 'none' }}><img src="/logo.svg" alt="Hayya AI" width="28" height="28" style={{ display: 'block' }} />Hayya<span style={{ color: '#D8B16A' }}> AI</span></Link>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none' }}>Home</Link>
          <Link href="/privacy" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/contact" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none' }}>Contact</Link>
        </div>
      </header>

      <section style={{ textAlign: 'center', padding: '56px 24px 24px' }}>
        <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', color: '#D8B16A', border: '1px solid rgba(216,177,106,.3)', borderRadius: '999px', padding: '6px 14px', marginBottom: '20px' }}>LEGAL</div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 10px' }}>Terms of Service</h1>
        <p style={{ fontSize: '13px', color: '#64748b' }}>Last updated: October 1, 2026</p>
      </section>

      <section style={{ ...wrap, paddingBottom: '80px' }}>
        <p style={p}>
          These Terms of Service ("Terms") govern your access to and use of Hayya AI (the "Service"), available at hayyaai.com,
          provided by <strong style={{ color: '#e2e8f0' }}>Hayya Med Artificial Intelligence</strong> ("Hayya Med AI," "we," "us," "our"),
          a company registered in Qatar (CR 219050), with its registered office at Zone 6, Street 970, Grand Hamad St, Building 2,
          3rd Floor, Tejwaans Business Center, Doha, Qatar. By creating an account or using the Service, you agree to these Terms.
          If you are agreeing on behalf of a business or organization, you confirm you have authority to bind that organization.
        </p>

        <h2 style={h2}>1. The Service</h2>
        <p style={p}>
          Hayya AI is a business CRM and AI-powered customer engagement platform for healthcare and other service businesses.
          It lets you manage contacts and leads, communicate via connected channels (including WhatsApp, Instagram, and Facebook,
          where you connect your own accounts), generate AI-assisted content and responses, and track engagement through dashboards
          and reports. Features vary by subscription plan.
        </p>

        <h2 style={h2}>2. Accounts</h2>
        <p style={p}>
          You must provide accurate information when creating an account and keep your login credentials secure. You are responsible
          for all activity under your account, including that of team members you invite. Notify us immediately at
          abbas@hayyamed.ai if you suspect unauthorized access.
        </p>

        <h2 style={h2}>3. Your Data and Content</h2>
        <p style={p}>
          You retain ownership of the contacts, messages, content, and other data you upload or generate through the Service
          ("Customer Data"). You are responsible for having the legal right to collect, store, and process that data — including
          any contacts you import and any consent required to message them. We process Customer Data on your behalf to provide the
          Service, as described in our <Link href="/privacy" style={{ color: '#D8B16A' }}>Privacy Policy</Link>.
        </p>

        <h2 style={h2}>4. AI Features</h2>
        <p style={p}>
          The Service includes AI-generated content, suggested replies, and automated features powered by third-party AI providers.
          AI output can be inaccurate or inappropriate for your specific context. You are responsible for reviewing AI-generated
          content before sending it to your contacts or publishing it, particularly where it concerns medical, health, or
          safety-related information. The Service is an administrative and communication tool — it does not provide medical advice,
          diagnosis, or treatment.
        </p>

        <h2 style={h2}>5. Connected Third-Party Accounts</h2>
        <p style={p}>
          If you connect WhatsApp, Instagram, Facebook, or other third-party accounts, you are responsible for complying with that
          platform's own terms and policies, including messaging and consent rules (such as WhatsApp Business Policy requirements).
          We are not responsible for actions taken by third-party platforms against your connected accounts.
        </p>

        <h2 style={h2}>6. Subscriptions and Billing</h2>
        <p style={p}>
          Paid plans are billed on a recurring basis (monthly, unless stated otherwise) through our payment processor. Prices are
          shown in QAR unless otherwise noted. You can cancel at any time; cancellation takes effect at the end of your current
          billing period, and we do not provide partial-period refunds except where required by law. We may change plan pricing
          with reasonable advance notice to active subscribers.
        </p>

        <h2 style={h2}>7. Acceptable Use</h2>
        <p style={p}>
          You agree not to use the Service to send unsolicited bulk messages (spam), harass or deceive recipients, distribute
          malware, violate applicable healthcare, privacy, or consumer-protection laws, or attempt to interfere with the Service's
          security or availability. We may suspend or terminate accounts that violate this section.
        </p>

        <h2 style={h2}>8. Availability and Changes</h2>
        <p style={p}>
          We aim to keep the Service available and reliable but do not guarantee uninterrupted access. We may update, modify, or
          discontinue features with reasonable notice where practical. Scheduled maintenance will be communicated in advance where
          feasible.
        </p>

        <h2 style={h2}>9. Limitation of Liability</h2>
        <p style={p}>
          To the maximum extent permitted by law, Hayya Med Artificial Intelligence is not liable for indirect, incidental, or
          consequential damages arising from your use of the Service, including loss of data, revenue, or business opportunities.
          Our total liability for any claim is limited to the amount you paid us in the 3 months preceding the claim.
        </p>

        <h2 style={h2}>10. Termination</h2>
        <p style={p}>
          You may stop using the Service and delete your account at any time. We may suspend or terminate accounts that violate
          these Terms, with notice where practical. Upon termination, your right to access the Service ends; we handle your data
          as described in our Privacy Policy.
        </p>

        <h2 style={h2}>11. Governing Law</h2>
        <p style={p}>
          These Terms are governed by the laws of the State of Qatar, without regard to conflict-of-law principles. Any disputes
          will be subject to the exclusive jurisdiction of the competent courts of Qatar.
        </p>

        <h2 style={h2}>12. Changes to These Terms</h2>
        <p style={p}>
          We may update these Terms from time to time. Material changes will be communicated via the Service or by email to account
          administrators before taking effect. Continued use after changes take effect constitutes acceptance.
        </p>

        <h2 style={h2}>13. Contact</h2>
        <p style={p}>
          Questions about these Terms can be sent to <a href="mailto:abbas@hayyamed.ai" style={{ color: '#D8B16A' }}>abbas@hayyamed.ai</a>,
          or by mail to Hayya Med Artificial Intelligence, Zone 6, Street 970, Grand Hamad St, Building 2, 3rd Floor, Tejwaans
          Business Center, Doha, Qatar · P.O. Box 20278.
        </p>
      </section>
    </div>
  )
}
