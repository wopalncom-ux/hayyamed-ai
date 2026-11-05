import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'

// Code samples stay in English/LTR in both languages; only prose is translated.
const Code = ({ children }) => (
  <pre dir="ltr" style={{ background: '#07090f', border: '1px solid #1a2235', borderRadius: '10px', padding: '16px', fontSize: '12.5px', color: '#cbd5e1', overflowX: 'auto', lineHeight: 1.7, margin: '10px 0', textAlign: 'left' }}>{children}</pre>
)
const H = ({ children }) => <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '34px 0 8px', color: '#fff' }}>{children}</h2>
const P = ({ children, ar }) => <p style={{ color: '#94a3b8', fontSize: ar ? '15px' : '14px', lineHeight: 1.75, margin: '8px 0' }}>{children}</p>
const Pill = ({ children, c = '#D8B16A' }) => <span dir="ltr" style={{ fontSize: '11px', fontWeight: 800, color: c, background: c + '1a', border: `1px solid ${c}44`, borderRadius: '5px', padding: '2px 8px' }}>{children}</span>
const C = ({ children, c = '#a78bfa' }) => <code dir="ltr" style={{ color: c }}>{children}</code>

const T = {
  en: {
    h1: 'Developer API & Webhooks',
    intro: 'Push leads into your CRM from anywhere, and receive real-time events in your own systems. Base URL',
    authH: 'Authentication',
    auth: [(l) => <>Create an API key in your dashboard at {l}. Send it in the </>, ' header on every request. Keys are shown once — store them securely.'],
    apiLink: 'Integrations → API & Keys',
    leadH: 'Create a lead',
    lead: ['Creates a contact in your CRM (it appears in Contacts and the inbox, is auto-scored, and fires the ', ' webhook). Perfect for website forms, landing pages, and ad lead-gen.'],
    response: 'Response', responseRest: ' — the created contact:',
    hooksH: 'Webhooks',
    hooks: [(l) => <>Register endpoints at {l}. We POST a JSON body when an event fires. Available events:</>],
    hooksLink: 'Integrations → Webhooks',
    events: { 'contact.created': 'a new lead was created', 'conversation.escalated': 'a customer asked for a human', 'booking.created': 'a new booking was made', 'payment.created': 'a payment link was generated' },
    payload: 'Payload', payloadRest: [' — every delivery looks like this, with an ', ' header:'],
    sigH: 'Verifying signatures',
    sig: ['If you set a secret on a webhook, each delivery includes an ', ' header — an HMAC-SHA256 of the raw body using your secret. Verify it to confirm the request came from Hayya AI:'],
    notesH: 'Notes',
    notes: ['All requests are scoped to the workspace that owns the API key.', 'Webhook delivery is best-effort with an 8-second timeout.', 'Revoke a key any time — apps using it stop immediately.'],
    getKey: 'Get an API key →', setHooks: 'Set up webhooks',
    owned: 'Owned and managed by Hayya Med AI · Doha, Qatar',
  },
  ar: {
    h1: 'واجهة برمجة التطبيقات (API) والـ Webhooks للمطوّرين',
    intro: 'أضِف العملاء المحتملين إلى نظام CRM من أي مكان، واستقبل الأحداث لحظياً في أنظمتك الخاصة. عنوان الأساس (Base URL)',
    authH: 'المصادقة',
    auth: [(l) => <>أنشئ مفتاح API من لوحة التحكم عبر {l}، ثم أرسله في الترويسة </>, ' مع كل طلب. يظهر المفتاح مرة واحدة فقط، فاحفظه في مكان آمن.'],
    apiLink: 'التكاملات ← API والمفاتيح',
    leadH: 'إنشاء عميل محتمل',
    lead: ['يُنشئ جهة اتصال في نظام CRM (تظهر في جهات الاتصال وصندوق الوارد، وتُقيَّم تلقائياً، ويُطلق حدث ', '). مثالي لنماذج المواقع وصفحات الهبوط والإعلانات الموجّهة لجمع العملاء المحتملين.'],
    response: 'الاستجابة', responseRest: ': جهة الاتصال التي تم إنشاؤها:',
    hooksH: 'الـ Webhooks',
    hooks: [(l) => <>سجّل عناوين الاستقبال عبر {l}. نرسل طلب POST بمحتوى JSON عند وقوع أي حدث. الأحداث المتاحة:</>],
    hooksLink: 'التكاملات ← Webhooks',
    events: { 'contact.created': 'تم إنشاء عميل محتمل جديد', 'conversation.escalated': 'طلب عميل التحدث مع موظف', 'booking.created': 'تم إنشاء حجز جديد', 'payment.created': 'تم إنشاء رابط دفع' },
    payload: 'محتوى الطلب', payloadRest: [': يصل كل إرسال بهذا الشكل، مع الترويسة ', ':'],
    sigH: 'التحقق من التوقيع',
    sig: ['إذا حدّدت مفتاحاً سرياً (secret) للـ Webhook، فسيتضمّن كل إرسال الترويسة ', '، وهي توقيع HMAC-SHA256 للمحتوى الخام باستخدام مفتاحك السري. تحقّق منها للتأكد من أن الطلب صادر عن Hayya AI:'],
    notesH: 'ملاحظات',
    notes: ['تقتصر جميع الطلبات على مساحة العمل التي يتبع لها مفتاح API.', 'يتم إرسال الـ Webhooks بأفضل جهد ممكن، مع مهلة انتظار مدتها 8 ثوانٍ.', 'يمكنك إلغاء أي مفتاح في أي وقت، فتتوقف التطبيقات التي تستخدمه فوراً.'],
    getKey: 'احصل على مفتاح API ←', setHooks: 'إعداد الـ Webhooks',
    owned: 'تملكها وتديرها شركة هيّا ميد للذكاء الاصطناعي · الدوحة، قطر',
  },
}

export default function DevelopersPage({ locale = 'en' }) {
  const t = T[locale] || T.en
  const ar = locale === 'ar'
  const base = 'https://api.hayyaai.com/api/v1'
  const linkStyle = { color: '#D8B16A' }
  const listStyle = { color: '#94a3b8', fontSize: ar ? '15px' : '14px', lineHeight: 2, margin: '8px 0', paddingInlineStart: '18px' }
  return (
    <div style={{ background: '#07090f', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <SiteHeader locale={locale} path="/developers" links={['home', 'contact']} />
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '32px 24px 80px' }}>
        <div dir="ltr" style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700, letterSpacing: '0.1em', textAlign: ar ? 'right' : 'left' }}>HAYYA AI</div>
        <h1 style={{ fontSize: '34px', fontWeight: 900, margin: '6px 0 4px' }}>{t.h1}</h1>
        <P ar={ar}>{t.intro} <C c="#D8B16A">{base}</C></P>

        <H>{t.authH}</H>
        <P ar={ar}>{t.auth[0](<Link href="/integrations/api" style={linkStyle}>{t.apiLink}</Link>)}<C>X-API-Key</C>{t.auth[1]}</P>
        <Code>{`X-API-Key: hk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</Code>

        <H>{t.leadH} <Pill>POST</Pill></H>
        <P ar={ar}>{t.lead[0]}<C>contact.created</C>{t.lead[1]}</P>
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
        <P ar={ar}><strong style={{ color: '#e2e8f0' }}>{t.response}</strong>{t.responseRest}</P>
        <Code>{`{ "id": "…", "name": "Ali Hassan", "phone": "+97455123456",
  "status": "NEW", "score": 33, "source": "website" }`}</Code>

        <H>{t.hooksH}</H>
        <P ar={ar}>{t.hooks[0](<Link href="/integrations/webhooks" style={linkStyle}>{t.hooksLink}</Link>)}</P>
        <ul style={listStyle}>
          {Object.entries(t.events).map(([k, v]) => (<li key={k}><C>{k}</C> — {v}</li>))}
        </ul>
        <P ar={ar}><strong style={{ color: '#e2e8f0' }}>{t.payload}</strong>{t.payloadRest[0]}<C>X-Hayya-Event</C>{t.payloadRest[1]}</P>
        <Code>{`{
  "event": "contact.created",
  "data": { "id": "…", "name": "Ali Hassan", "source": "website" },
  "timestamp": "2026-06-27T10:00:00.000Z"
}`}</Code>

        <H>{t.sigH}</H>
        <P ar={ar}>{t.sig[0]}<C>X-Hayya-Signature</C>{t.sig[1]}</P>
        <Code>{`import crypto from 'crypto'

function verify(rawBody, signature, secret) {
  const expected = crypto.createHmac('sha256', secret)
    .update(rawBody).digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(expected), Buffer.from(signature))
}`}</Code>

        <H>{t.notesH}</H>
        <ul style={listStyle}>
          {t.notes.map((n) => <li key={n}>{n}</li>)}
        </ul>

        <div style={{ marginTop: '40px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/integrations/api" style={{ padding: '11px 22px', background: '#D8B16A', color: '#07090f', borderRadius: '8px', fontWeight: 800, fontSize: '13px', textDecoration: 'none' }}>{t.getKey}</Link>
          <Link href="/integrations/webhooks" style={{ padding: '11px 22px', background: '#111622', border: '1px solid #1a2235', color: '#e2e8f0', borderRadius: '8px', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>{t.setHooks}</Link>
        </div>
        <div style={{ marginTop: '40px', borderTop: '1px solid #1a2235', paddingTop: '20px', fontSize: ar ? '12px' : '11px', color: '#475569' }}>
          {t.owned}
        </div>
      </div>
    </div>
  )
}
