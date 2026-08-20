import { Controller, Post, Body, BadRequestException } from '@nestjs/common'
import { Public } from '../../common/decorators/public.decorator'
import { EmailService } from '../email/email.service'

const TO = 'abbas@hayyamed.ai'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Public "Contact us" inquiry from the hayyaai.com marketing site — throttled
// by the app's global ThrottlerGuard (100 req/min) since this route has no auth.
@Controller('inquiries')
export class InquiriesController {
  constructor(private email: EmailService) {}

  @Public()
  @Post()
  async submit(@Body() body: { name: string; email: string; phone?: string; company?: string; message: string }) {
    const name = body?.name?.trim()
    const email = body?.email?.trim()
    const message = body?.message?.trim()
    const phone = body?.phone?.trim()
    const company = body?.company?.trim()

    if (!name || !email || !message) throw new BadRequestException('Name, email, and message are required.')
    if (!EMAIL_RE.test(email)) throw new BadRequestException('Invalid email address.')

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8f8f8;border-radius:8px;">
        <h2 style="color:#7C1535;margin-top:0;">New Hayya AI Website Inquiry</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;font-weight:600;color:#333;width:120px;">Name</td><td style="padding:8px 0;color:#555;">${name}</td></tr>
          ${company ? `<tr><td style="padding:8px 0;font-weight:600;color:#333;">Company</td><td style="padding:8px 0;color:#555;">${company}</td></tr>` : ''}
          <tr><td style="padding:8px 0;font-weight:600;color:#333;">Email</td><td style="padding:8px 0;color:#555;"><a href="mailto:${email}">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding:8px 0;font-weight:600;color:#333;">Phone</td><td style="padding:8px 0;color:#555;">${phone}</td></tr>` : ''}
        </table>
        <hr style="margin:16px 0;border:none;border-top:1px solid #ddd;"/>
        <h3 style="color:#333;margin-top:0;">Message</h3>
        <p style="color:#555;white-space:pre-wrap;">${message}</p>
        <hr style="margin:16px 0;border:none;border-top:1px solid #ddd;"/>
        <p style="font-size:12px;color:#999;">Sent via hayyaai.com contact form</p>
      </div>
    `

    const sent = await this.email.send({
      to: TO,
      subject: `New Hayya AI inquiry from ${name}`,
      html,
      replyTo: email,
      tag: 'website-inquiry',
    })
    if (!sent) throw new BadRequestException('Failed to send. Please try again or reach us on WhatsApp.')

    return { success: true }
  }
}
