import LegalShell, { legalStyles as S } from '@/components/site/LegalShell'
import { alternatesFor } from '@/lib/i18n'
import { pageOpenGraph } from '@/lib/site-shell'

const title = 'Privacy Policy — Hayya AI'
const description = 'Privacy Policy for Hayya AI, operated by Hayya Med Artificial Intelligence.'

export const metadata = {
  title,
  description,
  alternates: alternatesFor('en', '/privacy'),
  openGraph: pageOpenGraph('en', { title, description, url: '/privacy' }),
}

export default function Privacy() {
  return (
    <LegalShell locale="en" path="/privacy" title="Privacy Policy" otherLink="terms">
        <p style={S.p}>
          <strong style={{ color: '#e2e8f0' }}>Hayya Med Artificial Intelligence</strong> (CR 219050), registered at Zone 6, Street 970,
          Grand Hamad St, Building 2, 3rd Floor, Tejwaans Business Center, Doha, Qatar, operates Hayya AI (hayyamed.ai). This policy
          explains what data we collect, how we use it, and your rights.
        </p>

        <h2 style={S.h2}>1. Two Roles We Play</h2>
        <p style={S.p}>
          For your <strong style={{ color: '#e2e8f0' }}>account data</strong> (your name, business email, login credentials, billing
          details), we act as the data controller. For the <strong style={{ color: '#e2e8f0' }}>Customer Data</strong> you upload or
          generate through the Service — such as your contacts, leads, and conversation history — we act as a data processor acting
          on your instructions; you remain the controller of that data and are responsible for having a lawful basis to collect and
          process it.
        </p>

        <h2 style={S.h2}>2. What We Collect</h2>
        <ul style={S.ul}>
          <li style={S.li}><strong style={{ color: '#e2e8f0' }}>Account information:</strong> name, business email, phone number, organization name, password (stored hashed, never in plain text).</li>
          <li style={S.li}><strong style={{ color: '#e2e8f0' }}>Customer Data you provide:</strong> contacts, leads, messages, and notes you add or import into the Service.</li>
          <li style={S.li}><strong style={{ color: '#e2e8f0' }}>Connected channel data:</strong> messages and metadata from WhatsApp, Instagram, or Facebook accounts you connect, limited to what's needed to operate those integrations.</li>
          <li style={S.li}><strong style={{ color: '#e2e8f0' }}>Billing information:</strong> processed by our payment providers (Stripe and/or MyFatoorah); we do not store full card numbers ourselves.</li>
          <li style={S.li}><strong style={{ color: '#e2e8f0' }}>Usage data:</strong> log data, device/browser information, and feature usage, used for security, debugging, and improving the Service.</li>
        </ul>

        <h2 style={S.h2}>3. How We Use Data</h2>
        <ul style={S.ul}>
          <li style={S.li}>To provide and operate the Service, including AI-generated content and automated responses.</li>
          <li style={S.li}>To process payments and manage subscriptions.</li>
          <li style={S.li}>To send account-related emails (welcome, password reset, billing notices) and, where you've opted in, product updates.</li>
          <li style={S.li}>To maintain security, detect abuse, and enforce our Terms of Service.</li>
          <li style={S.li}>To improve the Service's reliability and features.</li>
        </ul>

        <h2 style={S.h2}>4. AI Processing</h2>
        <p style={S.p}>
          AI features in the Service are powered by third-party AI model providers (such as Google Gemini, OpenAI, and Anthropic).
          When you use an AI feature, relevant text (such as a contact's message or your prompt) is sent to the applicable provider
          to generate a response. We do not knowingly submit full patient medical records to these providers, and AI output should
          always be reviewed before use in a healthcare context.
        </p>

        <h2 style={S.h2}>5. Where Data Is Stored</h2>
        <p style={S.p}>
          Our primary infrastructure runs on Google Cloud in the me-central1 (Doha, Qatar) region. Some data may be processed
          outside Qatar by the third-party providers listed in this policy (AI providers, payment processors, email delivery, and
          connected messaging platforms) solely to the extent necessary to provide those specific features.
        </p>

        <h2 style={S.h2}>6. Who We Share Data With</h2>
        <p style={S.p}>We share data only with service providers necessary to operate Hayya AI, including:</p>
        <ul style={S.ul}>
          <li style={S.li}>Cloud infrastructure and database hosting (Google Cloud).</li>
          <li style={S.li}>AI model providers, for AI-powered features you actively use.</li>
          <li style={S.li}>Payment processors (Stripe, MyFatoorah), for billing.</li>
          <li style={S.li}>Email delivery providers, for transactional emails (account, billing, password reset).</li>
          <li style={S.li}>Meta Platforms (WhatsApp, Instagram, Facebook), when you connect those channels.</li>
        </ul>
        <p style={S.p}>We do not sell your data or your contacts' data to third parties.</p>

        <h2 style={S.h2}>7. Data Retention</h2>
        <p style={S.p}>
          We retain account and Customer Data for as long as your account is active, and for a reasonable period after closure to
          allow recovery or as required for legal, accounting, or security purposes. You can request deletion of your account and
          associated data at any time (see Section 9).
        </p>

        <h2 style={S.h2}>8. Security</h2>
        <p style={S.p}>
          We use encryption in transit (HTTPS), password hashing, and tenant-isolated data access controls to protect your
          information. No system is completely secure, and we encourage you to use a strong, unique password and enable any
          available account security features.
        </p>

        <h2 style={S.h2}>9. Your Rights</h2>
        <p style={S.p}>
          Depending on your jurisdiction (including under Qatar's PDPL and, where applicable, the EU GDPR), you may have the right
          to access, correct, export, or delete your personal data, and to object to or restrict certain processing. To exercise
          any of these rights, contact us at <a href="mailto:abbas@hayyamed.ai" style={{ color: '#D8B16A' }}>abbas@hayyamed.ai</a>.
          We will respond within a reasonable timeframe.
        </p>

        <h2 style={S.h2}>10. Cookies</h2>
        <p style={S.p}>
          We use essential cookies required for login sessions and basic site functionality. We do not currently use third-party
          advertising or tracking cookies.
        </p>

        <h2 style={S.h2}>11. Children's Data</h2>
        <p style={S.p}>
          The Service is intended for business use by adults and is not directed at children. We do not knowingly collect personal
          data from children.
        </p>

        <h2 style={S.h2}>12. Changes to This Policy</h2>
        <p style={S.p}>
          We may update this Privacy Policy from time to time. Material changes will be communicated via the Service or by email to
          account administrators before taking effect.
        </p>

        <h2 style={S.h2}>13. Contact</h2>
        <p style={S.p}>
          Questions about this policy, or requests regarding your data, can be sent to{' '}
          <a href="mailto:abbas@hayyamed.ai" style={{ color: '#D8B16A' }}>abbas@hayyamed.ai</a>, or by mail to Hayya Med Artificial
          Intelligence, Zone 6, Street 970, Grand Hamad St, Building 2, 3rd Floor, Tejwaans Business Center, Doha, Qatar · P.O. Box
          20278.
        </p>
      </LegalShell>
  )
}
