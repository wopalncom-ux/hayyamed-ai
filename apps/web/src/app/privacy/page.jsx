import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Hayya AI',
  description: 'Privacy Policy for Hayya AI, operated by Hayya Med Artificial Intelligence.',
  alternates: { canonical: '/privacy' },
}

const wrap = { maxWidth: '820px', margin: '0 auto', padding: '0 24px' }
const h2 = { fontSize: '18px', fontWeight: 800, margin: '36px 0 12px', color: '#e2e8f0' }
const p = { fontSize: '14px', color: '#94a3b8', lineHeight: 1.8, margin: '0 0 14px' }
const li = { fontSize: '14px', color: '#94a3b8', lineHeight: 1.8, marginBottom: '8px' }

export default function Privacy() {
  return (
    <div style={{ background: '#070b0a', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', overflowX: 'hidden' }}>
      <header style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', fontWeight: 900, fontSize: '18px', color: '#e2e8f0', textDecoration: 'none' }}><img src="/logo.svg" alt="Hayya AI" width="28" height="28" style={{ display: 'block' }} />Hayya<span style={{ color: '#D8B16A' }}> AI</span></Link>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none' }}>Home</Link>
          <Link href="/terms" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none' }}>Terms</Link>
          <Link href="/contact" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none' }}>Contact</Link>
        </div>
      </header>

      <section style={{ textAlign: 'center', padding: '56px 24px 24px' }}>
        <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', color: '#D8B16A', border: '1px solid rgba(216,177,106,.3)', borderRadius: '999px', padding: '6px 14px', marginBottom: '20px' }}>LEGAL</div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 10px' }}>Privacy Policy</h1>
        <p style={{ fontSize: '13px', color: '#64748b' }}>Last updated: October 1, 2026</p>
      </section>

      <section style={{ ...wrap, paddingBottom: '80px' }}>
        <p style={p}>
          <strong style={{ color: '#e2e8f0' }}>Hayya Med Artificial Intelligence</strong> (CR 219050), registered at Zone 6, Street 970,
          Grand Hamad St, Building 2, 3rd Floor, Tejwaans Business Center, Doha, Qatar, operates Hayya AI (hayyaai.com). This policy
          explains what data we collect, how we use it, and your rights.
        </p>

        <h2 style={h2}>1. Two Roles We Play</h2>
        <p style={p}>
          For your <strong style={{ color: '#e2e8f0' }}>account data</strong> (your name, business email, login credentials, billing
          details), we act as the data controller. For the <strong style={{ color: '#e2e8f0' }}>Customer Data</strong> you upload or
          generate through the Service — such as your contacts, leads, and conversation history — we act as a data processor acting
          on your instructions; you remain the controller of that data and are responsible for having a lawful basis to collect and
          process it.
        </p>

        <h2 style={h2}>2. What We Collect</h2>
        <ul style={{ paddingLeft: '20px', margin: '0 0 14px' }}>
          <li style={li}><strong style={{ color: '#e2e8f0' }}>Account information:</strong> name, business email, phone number, organization name, password (stored hashed, never in plain text).</li>
          <li style={li}><strong style={{ color: '#e2e8f0' }}>Customer Data you provide:</strong> contacts, leads, messages, and notes you add or import into the Service.</li>
          <li style={li}><strong style={{ color: '#e2e8f0' }}>Connected channel data:</strong> messages and metadata from WhatsApp, Instagram, or Facebook accounts you connect, limited to what's needed to operate those integrations.</li>
          <li style={li}><strong style={{ color: '#e2e8f0' }}>Billing information:</strong> processed by our payment providers (Stripe and/or MyFatoorah); we do not store full card numbers ourselves.</li>
          <li style={li}><strong style={{ color: '#e2e8f0' }}>Usage data:</strong> log data, device/browser information, and feature usage, used for security, debugging, and improving the Service.</li>
        </ul>

        <h2 style={h2}>3. How We Use Data</h2>
        <ul style={{ paddingLeft: '20px', margin: '0 0 14px' }}>
          <li style={li}>To provide and operate the Service, including AI-generated content and automated responses.</li>
          <li style={li}>To process payments and manage subscriptions.</li>
          <li style={li}>To send account-related emails (welcome, password reset, billing notices) and, where you've opted in, product updates.</li>
          <li style={li}>To maintain security, detect abuse, and enforce our Terms of Service.</li>
          <li style={li}>To improve the Service's reliability and features.</li>
        </ul>

        <h2 style={h2}>4. AI Processing</h2>
        <p style={p}>
          AI features in the Service are powered by third-party AI model providers (such as Google Gemini, OpenAI, and Anthropic).
          When you use an AI feature, relevant text (such as a contact's message or your prompt) is sent to the applicable provider
          to generate a response. We do not knowingly submit full patient medical records to these providers, and AI output should
          always be reviewed before use in a healthcare context.
        </p>

        <h2 style={h2}>5. Where Data Is Stored</h2>
        <p style={p}>
          Our primary infrastructure runs on Google Cloud in the me-central1 (Doha, Qatar) region. Some data may be processed
          outside Qatar by the third-party providers listed in this policy (AI providers, payment processors, email delivery, and
          connected messaging platforms) solely to the extent necessary to provide those specific features.
        </p>

        <h2 style={h2}>6. Who We Share Data With</h2>
        <p style={p}>We share data only with service providers necessary to operate Hayya AI, including:</p>
        <ul style={{ paddingLeft: '20px', margin: '0 0 14px' }}>
          <li style={li}>Cloud infrastructure and database hosting (Google Cloud).</li>
          <li style={li}>AI model providers, for AI-powered features you actively use.</li>
          <li style={li}>Payment processors (Stripe, MyFatoorah), for billing.</li>
          <li style={li}>Email delivery providers, for transactional emails (account, billing, password reset).</li>
          <li style={li}>Meta Platforms (WhatsApp, Instagram, Facebook), when you connect those channels.</li>
        </ul>
        <p style={p}>We do not sell your data or your contacts' data to third parties.</p>

        <h2 style={h2}>7. Data Retention</h2>
        <p style={p}>
          We retain account and Customer Data for as long as your account is active, and for a reasonable period after closure to
          allow recovery or as required for legal, accounting, or security purposes. You can request deletion of your account and
          associated data at any time (see Section 9).
        </p>

        <h2 style={h2}>8. Security</h2>
        <p style={p}>
          We use encryption in transit (HTTPS), password hashing, and tenant-isolated data access controls to protect your
          information. No system is completely secure, and we encourage you to use a strong, unique password and enable any
          available account security features.
        </p>

        <h2 style={h2}>9. Your Rights</h2>
        <p style={p}>
          Depending on your jurisdiction (including under Qatar's PDPL and, where applicable, the EU GDPR), you may have the right
          to access, correct, export, or delete your personal data, and to object to or restrict certain processing. To exercise
          any of these rights, contact us at <a href="mailto:abbas@hayyamed.ai" style={{ color: '#D8B16A' }}>abbas@hayyamed.ai</a>.
          We will respond within a reasonable timeframe.
        </p>

        <h2 style={h2}>10. Cookies</h2>
        <p style={p}>
          We use essential cookies required for login sessions and basic site functionality. We do not currently use third-party
          advertising or tracking cookies.
        </p>

        <h2 style={h2}>11. Children's Data</h2>
        <p style={p}>
          The Service is intended for business use by adults and is not directed at children. We do not knowingly collect personal
          data from children.
        </p>

        <h2 style={h2}>12. Changes to This Policy</h2>
        <p style={p}>
          We may update this Privacy Policy from time to time. Material changes will be communicated via the Service or by email to
          account administrators before taking effect.
        </p>

        <h2 style={h2}>13. Contact</h2>
        <p style={p}>
          Questions about this policy, or requests regarding your data, can be sent to{' '}
          <a href="mailto:abbas@hayyamed.ai" style={{ color: '#D8B16A' }}>abbas@hayyamed.ai</a>, or by mail to Hayya Med Artificial
          Intelligence, Zone 6, Street 970, Grand Hamad St, Building 2, 3rd Floor, Tejwaans Business Center, Doha, Qatar · P.O. Box
          20278.
        </p>
      </section>
    </div>
  )
}
