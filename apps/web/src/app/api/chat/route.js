const BUSINESS_CONTEXT = `
You are the AI assistant for Hayyamed AI, an omnichannel CRM platform based in Qatar.

ABOUT HAYYAMED AI:
- We help businesses manage WhatsApp, Instagram, Facebook, Telegram and Email from one platform
- We serve businesses in Qatar and the GCC region
- We respond in Arabic and English

OUR PLANS AND PRICES:
- Starter Plan: QAR 800/month — up to 1,000 contacts, 5,000 messages
- CRM Pro Plan: QAR 2,500/month — up to 10,000 contacts, 50,000 messages, AI responses
- Enterprise Plan: QAR 8,000/month — unlimited contacts, unlimited messages, full AI, dedicated support

OUR SERVICES:
- Omnichannel inbox (WhatsApp, Instagram, Facebook, Telegram, Email)
- AI-powered automatic responses
- Contact management and CRM
- Campaign manager for bulk messaging
- Chatbot builder with flow automation
- Analytics and reports
- Agency multi-client management

WORKING HOURS:
- Sunday to Thursday: 8am to 6pm Qatar time
- Friday and Saturday: Closed

CONTACT:
- Email: info@hayyamed.ai
- Phone: +974 5555 0000
- Location: Doha, Qatar

IMPORTANT RULES:
- Always be polite and professional
- Respond in the same language as the customer (Arabic or English)
- If asked about pricing, give the exact prices above
- If you cannot answer, say you will connect them with a human agent
- Never make up information not listed above
- Keep responses concise and helpful
`

export async function POST(request) {
  try {
    const body = await request.json()
    const message = body.message
    const history = body.history || []
    const orgId = body.orgId || null

    let knowledgeContext = ''
    if (orgId) {
      try {
        const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        const kbRes = await fetch(`${BASE}/api/v1/chatbots/knowledge/active`, {
          headers: { 'x-org-id': orgId }
        })
        if (kbRes.ok) {
          const kb = await kbRes.json()
          if (kb) knowledgeContext = `\n\nKNOWLEDGE BASE (use this to answer client questions accurately):\n${kb}`
        }
      } catch {}
    }

    const systemPrompt = BUSINESS_CONTEXT + knowledgeContext

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message }
        ],
        max_tokens: 500,
      }),
    })

    const data = await response.json()
    const reply = data.choices[0].message.content
    return Response.json({ reply })
  } catch (error) {
    return Response.json({ reply: 'Sorry, AI is not available right now.' })
  }
}