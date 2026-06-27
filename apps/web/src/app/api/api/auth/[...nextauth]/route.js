export async function POST(request) {
  try {
    const { message, history } = await request.json()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant for Hayya AI, an omnichannel CRM platform in Qatar. Be polite and professional. Respond in the same language as the customer.'
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