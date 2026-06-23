import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly token: string
  private readonly from: string
  private readonly apiUrl = 'https://api.postmarkapp.com/email'

  constructor(private config: ConfigService) {
    this.token = this.config.get<string>('POSTMARK_SERVER_TOKEN') || ''
    this.from = this.config.get<string>('EMAIL_FROM') || 'Hayyamed AI <noreply@hayyamedai.com>'
  }

  private async send(to: string, subject: string, html: string, text: string): Promise<void> {
    if (!this.token) {
      this.logger.warn(`POSTMARK_SERVER_TOKEN not set — skipping email to ${to}: ${subject}`)
      return
    }
    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': this.token,
        },
        body: JSON.stringify({ From: this.from, To: to, Subject: subject, HtmlBody: html, TextBody: text, MessageStream: 'outbound' }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        this.logger.error(`Postmark error ${res.status}: ${JSON.stringify(body)}`)
      } else {
        this.logger.log(`Email sent to ${to}: ${subject}`)
      }
    } catch (err: any) {
      this.logger.error(`Email send failed: ${err?.message}`)
    }
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07090f;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07090f;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#0c0f1a;border:1px solid #1e2d42;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0a1628,#0f1f3d);padding:28px 32px;border-bottom:1px solid #1e2d42;">
          <div style="font-size:20px;font-weight:900;color:#e2e8f0;letter-spacing:-0.5px;">
            Hayya<span style="color:#00e5a0">med</span> AI
          </div>
          <div style="font-size:12px;color:#7a8fa6;margin-top:4px;">AI Omnichannel CRM Platform</div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="color:#e2e8f0;font-size:22px;margin:0 0 12px;font-weight:800;">Reset your password</h2>
          <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 28px;">
            We received a request to reset your Hayyamed AI password. Click the button below to set a new password. This link expires in <strong style="color:#e2e8f0;">1 hour</strong>.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#00e5a0;color:#07090f;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:800;font-size:14px;">
            Reset Password
          </a>
          <p style="color:#3d4f63;font-size:12px;margin:28px 0 0;line-height:1.6;">
            If you didn't request a password reset, you can safely ignore this email. Your password will not change.
          </p>
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid #1e2d42;">
            <p style="color:#3d4f63;font-size:11px;margin:0;">Or copy this link:<br>
              <span style="color:#7a8fa6;word-break:break-all;">${resetUrl}</span>
            </p>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #1e2d42;background:#07090f;">
          <p style="color:#3d4f63;font-size:11px;margin:0;text-align:center;">
            Hayyamed AI · Data stored in Qatar · me-central1 (Doha) · PDPL compliant
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    const text = `Reset your Hayyamed AI password\n\nClick here to reset your password (link expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`
    await this.send(to, 'Reset your Hayyamed AI password', html, text)
  }

  async sendTeamInvite(to: string, inviteeName: string, orgName: string, tempPassword: string, loginUrl: string): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07090f;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07090f;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#0c0f1a;border:1px solid #1e2d42;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0a1628,#0f1f3d);padding:28px 32px;border-bottom:1px solid #1e2d42;">
          <div style="font-size:20px;font-weight:900;color:#e2e8f0;letter-spacing:-0.5px;">
            Hayya<span style="color:#00e5a0">med</span> AI
          </div>
          <div style="font-size:12px;color:#7a8fa6;margin-top:4px;">AI Omnichannel CRM Platform</div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="color:#e2e8f0;font-size:22px;margin:0 0 12px;font-weight:800;">You've been invited! 🎉</h2>
          <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Hi ${inviteeName}, you've been added to <strong style="color:#e2e8f0;">${orgName}</strong> on Hayyamed AI.
            Use the credentials below to log in and get started.
          </p>
          <!-- Credentials box -->
          <div style="background:#07090f;border:1px solid #1e2d42;border-radius:8px;padding:20px;margin:0 0 24px;">
            <div style="margin-bottom:12px;">
              <div style="font-size:10px;color:#7a8fa6;letter-spacing:1px;margin-bottom:4px;">EMAIL</div>
              <div style="font-size:14px;color:#e2e8f0;font-weight:600;">${to}</div>
            </div>
            <div>
              <div style="font-size:10px;color:#7a8fa6;letter-spacing:1px;margin-bottom:4px;">TEMPORARY PASSWORD</div>
              <div style="font-size:16px;color:#00e5a0;font-weight:900;font-family:monospace;letter-spacing:2px;">${tempPassword}</div>
            </div>
          </div>
          <p style="color:#94a3b8;font-size:13px;margin:0 0 20px;">
            Please change your password after your first login.
          </p>
          <a href="${loginUrl}" style="display:inline-block;background:#00e5a0;color:#07090f;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:800;font-size:14px;">
            Log In Now
          </a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #1e2d42;background:#07090f;">
          <p style="color:#3d4f63;font-size:11px;margin:0;text-align:center;">
            Hayyamed AI · Data stored in Qatar · me-central1 (Doha) · PDPL compliant
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    const text = `You've been invited to ${orgName} on Hayyamed AI!\n\nEmail: ${to}\nTemporary Password: ${tempPassword}\n\nLog in at: ${loginUrl}\n\nPlease change your password after first login.`
    await this.send(to, `You've been invited to ${orgName} on Hayyamed AI`, html, text)
  }
}
