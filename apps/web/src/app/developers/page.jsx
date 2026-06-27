import Link from 'next/link'

export const metadata = {
  title: 'Developer API & Webhooks — Hayya AI',
  description: 'Integrate Hayya AI: push leads via the REST API and receive real-time webhook events.',
}

const Code = ({ children }) => (
  <pre style={{ background: '#07090f', border: '1px solid #1a2235', borderRadius: '10px', padding: '16px', fontSize: '12.5px', color: '#cbd5e1', overflowX: 'auto', lineHeight: 1.7, margin: '10px 0' }}>{children}</pre>
)
const H = ({ children }) => <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '34px 0 8px', color: '#fff' }}>{children}</h2>
const P = ({ children }) => <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.75, margin: '8px 0' }}>{children}</p>
const Pill = ({ children, c = '#00e5a0' }) => <span style={{ fontSize: '11px', fontWeight: 800, color: c, background: c + '1a', border: `1px solid ${c}44`, borderRadius: '5px', padding: '2px 8px' }}>{children}</span>

export default function Developers() {
  const base = 'https://api.hayyaai.com/api/v1'
  return (
    <div style={{ background: '#07090f', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700, letterSpacing: '0.1em' }}>HAYYA AI</div>
        <h1 style={{ fontSize: '34px', fontWeight: 900, margin: '6px 0 4px' }}>Developer API & Webhooks</h1>
        <P>Push leads into your CRM from anywhere, and receive real-time events in your own systems. Base URL <code style={{ color: '#00e5a0' }}>{base}</code></P>

        <H>Authentication</H>
        <P>Create an API key in your dashboard at <Link href="/integrations/api" style={{ color: '#00e5a0' }}>Integrations → API & Keys</Link>. Send it in the <code style={{ color: '#a78bfa' }}>X-API-Key</code> header on every request. Keys are shown once — store them securely.</P>
        <Code>{`X-API-Key: hk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</Code>

        <H>Create a lead <Pill>POST</Pill></H>
        <P>Creates a contact in your CRM (it appears in Contacts and the inbox, is auto-scored, and fires the <code style={{ color: '#a78bfa' }}>contact.created</code> webhook). Perfect for website forms, landing pages, and ad lead-gen.</P>
        <Code>{`curl -X POST ${base}/public/leads \\
  -H "X-API-Key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Ali Hassan",
    "phone": "+97455123456",
    "email": "ali@example.com",
    "source": "website",
    "notes": "Asked about pricing"
  }'`}</Code>
        <P><strong style={{ color: '#e2e8f0' }}>Response</strong> — the created contact:</P>
        <Code>{`{ "id": "…", "name": "Ali Hassan", "phone": "+97455123456",
  "status": "NEW", "score": 33, "source": "website" }`}</Code>

        <H>Webhooks</H>
        <P>Register endpoints at <Link href="/integrations/webhooks" style={{ color: '#00e5a0' }}>Integrations → Webhooks</Link>. We POST a JSON body when an event fires. Available events:</P>
        <ul style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 2, margin: '8px 0 8px 18px' }}>
          <li><code style={{ color: '#a78bfa' }}>contact.created</code> — a new lead was created</li>
          <li><code style={{ color: '#a78bfa' }}>conversation.escalated</code> — a customer asked for a human</li>
          <li><code style={{ color: '#a78bfa' }}>booking.created</code> — a new booking was made</li>
          <li><code style={{ color: '#a78bfa' }}>payment.created</code> — a payment link was generated</li>
        </ul>
        <P><strong style={{ color: '#e2e8f0' }}>Payload</strong> — every delivery looks like this, with an <code style={{ color: '#a78bfa' }}>X-Hayya-Event</code> header:</P>
        <Code>{`{
  "event": "contact.created",
  "data": { "id": "…", "name": "Ali Hassan", "source": "website" },
  "timestamp": "2026-06-27T10:00:00.000Z"
}`}</Code>

        <H>Verifying signatures</H>
        <P>If you set a secret on a webhook, each delivery includes an <code style={{ color: '#a78bfa' }}>X-Hayya-Signature</code> header — an HMAC-SHA256 of the raw body using your secret. Verify it to confirm the request came from Hayya AI:</P>
        <Code>{`import crypto from 'crypto'

function verify(rawBody, signature, secret) {
  const expected = crypto.createHmac('sha256', secret)
    .update(rawBody).digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(expected), Buffer.from(signature))
}`}</Code>

        <H>Notes</H>
        <ul style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 2, margin: '8px 0 8px 18px' }}>
          <li>All requests are scoped to the workspace that owns the API key.</li>
          <li>Webhook delivery is best-effort with an 8-second timeout.</li>
          <li>Revoke a key any time — apps using it stop immediately.</li>
        </ul>

        <div style={{ marginTop: '40px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/integrations/api" style={{ padding: '11px 22px', background: '#00e5a0', color: '#07090f', borderRadius: '8px', fontWeight: 800, fontSize: '13px', textDecoration: 'none' }}>Get an API key →</Link>
          <Link href="/integrations/webhooks" style={{ padding: '11px 22px', background: '#111622', border: '1px solid #1a2235', color: '#e2e8f0', borderRadius: '8px', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>Set up webhooks</Link>
        </div>
        <div style={{ marginTop: '40px', borderTop: '1px solid #1a2235', paddingTop: '20px', fontSize: '11px', color: '#475569' }}>
          Owned and managed by Hayya Med AI · Doha, Qatar
        </div>
      </div>
    </div>
  )
}
