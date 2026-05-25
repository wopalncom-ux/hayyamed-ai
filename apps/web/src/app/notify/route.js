export async function POST(request) {
  try {
    const { type, name, phone, message } = await request.json()

    const emailBody = `
New ${type} Alert from Hayyamed AI!

Contact: ${name}
Phone: ${phone}
Message: ${message}
Time: ${new Date().toLocaleString()}
    `

    console.log('EMAIL NOTIFICATION:', emailBody)

    // Send email using fetch to a free email service
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Hayyamed AI <notifications@hayyamed.ai>',
        to: ['wopalncom@gmail.com'],
        subject: `New ${type} - Hayyamed AI`,
        text: emailBody,
      }),
    })

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ success: false, error: error.message })
  }
}