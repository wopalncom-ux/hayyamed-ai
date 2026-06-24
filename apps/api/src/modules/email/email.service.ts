import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as postmark from 'postmark'
import { templates, TemplateKey } from './templates'

export interface SendOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
  tag?: string
}

@Injectable()
export class EmailService {
  private client: postmark.ServerClient | null = null
  private readonly logger = new Logger(EmailService.name)
  private readonly from: string

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('POSTMARK_SERVER_TOKEN')
    this.from = this.config.get<string>('EMAIL_FROM') || 'noreply@hayyaai.com'

    if (apiKey && apiKey !== 'your-postmark-server-token-here') {
      this.client = new postmark.ServerClient(apiKey)
    } else {
      this.logger.warn('POSTMARK_SERVER_TOKEN not set — emails will be logged only')
    }
  }

  async send(opts: SendOptions): Promise<boolean> {
    if (!this.client) {
      this.logger.log(`[EMAIL DRY RUN] to=${opts.to} subject="${opts.subject}"`)
      return true
    }
    try {
      await this.client.sendEmail({
        From: this.from,
        To: opts.to,
        Subject: opts.subject,
        HtmlBody: opts.html,
        ReplyTo: opts.replyTo || this.from,
        MessageStream: 'outbound',
        Tag: opts.tag,
      })
      this.logger.log(`Email sent to ${opts.to}: "${opts.subject}"`)
      return true
    } catch (err) {
      this.logger.error(`Email failed to ${opts.to}: ${err.message}`)
      return false
    }
  }

  async sendTemplate<K extends TemplateKey>(
    template: K,
    to: string,
    subject: string,
    data: Parameters<typeof templates[K]>[0],
    tag?: string,
  ): Promise<boolean> {
    const html = (templates[template] as (d: any) => string)(data)
    return this.send({ to, subject, html, tag: tag ?? template })
  }

  async sendWelcome(to: string, data: { name: string; orgName: string; loginUrl: string }) {
    return this.sendTemplate('welcome', to, `Welcome to Hayya AI, ${data.name}!`, data, 'welcome')
  }

  async sendPasswordReset(to: string, data: { name: string; resetUrl: string; expiresIn: string }) {
    return this.sendTemplate('passwordReset', to, 'Reset your Hayya AI password', data, 'password-reset')
  }

  async sendInvite(to: string, data: { inviterName: string; orgName: string; role: string; acceptUrl: string }) {
    return this.sendTemplate('inviteMember', to, `You've been invited to ${data.orgName}`, data, 'invite')
  }

  async sendSubscriptionConfirmed(to: string, data: { name: string; plan: string; nextBillingDate: string; dashboardUrl: string }) {
    return this.sendTemplate('subscriptionConfirmed', to, `${data.plan} subscription confirmed`, data, 'billing')
  }

  async sendSubscriptionCancelled(to: string, data: { name: string; plan: string; accessUntil: string; resubscribeUrl: string }) {
    return this.sendTemplate('subscriptionCancelled', to, 'Your subscription has been cancelled', data, 'billing')
  }

  async sendPaymentFailed(to: string, data: { name: string; amount: string; updateUrl: string }) {
    return this.sendTemplate('paymentFailed', to, 'Action required: Payment failed', data, 'billing')
  }

  async sendAgencyClientInvite(to: string, data: { agencyName: string; clientName: string; setupUrl: string }) {
    return this.sendTemplate('agencyClientInvite', to, `${data.agencyName} set up your AI workspace`, data, 'agency')
  }

  async sendAIAgentAlert(to: string, data: { orgName: string; agentName: string; alertType: string; detail: string; dashboardUrl: string }) {
    return this.sendTemplate('aiAgentAlert', to, `AI Agent Alert: ${data.alertType}`, data, 'ai-alert')
  }

  async sendRaw(to: string, subject: string, bodyText: string) {
    return this.send({
      to, subject,
      html: `<div style="font-family:sans-serif;line-height:1.6">${bodyText.replace(/\n/g, '<br>')}</div>`,
    })
  }
}
