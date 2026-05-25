export async function POST(request) {
  try {
    const body = await request.json()
    const message = body.message
    const history = body.history || []

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant for Hayyamed AI, a CRM platform in Qatar. Be polite and professional.'
          },
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