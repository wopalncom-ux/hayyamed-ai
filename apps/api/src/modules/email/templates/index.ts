const base = (content: string, preheader = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hayya AI</title>
<style>
  body { margin:0; padding:0; background:#0a0f1a; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
  .wrap { max-width:560px; margin:40px auto; }
  .header { background:#111622; border-radius:12px 12px 0 0; padding:28px 32px; border-bottom:1px solid #1a2235; }
  .logo { color:#00e5a0; font-size:20px; font-weight:800; letter-spacing:-0.5px; }
  .body { background:#111622; padding:32px; }
  .footer { background:#0d1424; border-radius:0 0 12px 12px; padding:20px 32px; border-top:1px solid #1a2235; }
  h1 { color:#e2e8f0; font-size:22px; font-weight:700; margin:0 0 12px; line-height:1.3; }
  p { color:#94a3b8; font-size:15px; line-height:1.6; margin:0 0 16px; }
  a.btn { display:inline-block; background:#00e5a0; color:#0a0f1a; padding:13px 28px; border-radius:8px; font-weight:700; font-size:15px; text-decoration:none; margin:8px 0 20px; }
  .divider { border:none; border-top:1px solid #1a2235; margin:24px 0; }
  .small { color:#64748b; font-size:12px; line-height:1.5; }
  .badge { display:inline-block; background:#00e5a022; color:#00e5a0; padding:3px 10px; border-radius:4px; font-size:12px; font-weight:700; }
</style>
</head>
<body>
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
<div class="wrap">
  <div class="header"><span class="logo">Hayya AI</span></div>
  <div class="body">${content}</div>
  <div class="footer">
    <p class="small">© 2026 Hayya Med AI · Doha, Qatar<br>
    Questions? Reply to this email or visit <a href="https://www.hayyaai.com" style="color:#00e5a0;">hayyaai.com</a></p>
  </div>
</div>
</body>
</html>
`

export const templates = {
  welcome: (data: { name: string; orgName: string; loginUrl: string }) =>
    base(`
      <h1>Welcome to Hayya AI 🎉</h1>
      <p>Hi <strong style="color:#e2e8f0;">${data.name}</strong>,</p>
      <p>Your workspace <span class="badge">${data.orgName}</span> is ready. Start converting leads with AI-powered conversations, automated workflows, and a full CRM — all in one place.</p>
      <a href="${data.loginUrl}" class="btn">Open Dashboard →</a>
      <hr class="divider">
      <p class="small">Quick start: Add your first contact → Set up an AI agent → Send your first campaign. The whole thing takes under 5 minutes.</p>
    `, `Welcome to Hayya AI — your workspace is ready`),

  passwordReset: (data: { name: string; resetUrl: string; expiresIn: string }) =>
    base(`
      <h1>Reset your password</h1>
      <p>Hi <strong style="color:#e2e8f0;">${data.name}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to set a new one.</p>
      <a href="${data.resetUrl}" class="btn">Reset Password →</a>
      <hr class="divider">
      <p class="small">This link expires in <strong>${data.expiresIn}</strong>. If you didn't request a password reset, you can safely ignore this email — your account is secure.</p>
    `, `Reset your Hayya AI password`),

  inviteMember: (data: { inviterName: string; orgName: string; role: string; acceptUrl: string }) =>
    base(`
      <h1>You've been invited to ${data.orgName}</h1>
      <p><strong style="color:#e2e8f0;">${data.inviterName}</strong> has invited you to join the <span class="badge">${data.orgName}</span> workspace on Hayya AI as a <strong>${data.role}</strong>.</p>
      <a href="${data.acceptUrl}" class="btn">Accept Invitation →</a>
      <hr class="divider">
      <p class="small">This invitation expires in 7 days. If you don't have a Hayya AI account yet, one will be created for you when you accept.</p>
    `, `${data.inviterName} invited you to ${data.orgName}`),

  subscriptionConfirmed: (data: { name: string; plan: string; nextBillingDate: string; dashboardUrl: string }) =>
    base(`
      <h1>Subscription confirmed ✓</h1>
      <p>Hi <strong style="color:#e2e8f0;">${data.name}</strong>,</p>
      <p>Your <span class="badge">${data.plan}</span> subscription is now active. All features are unlocked.</p>
      <a href="${data.dashboardUrl}" class="btn">Go to Dashboard →</a>
      <hr class="divider">
      <p class="small">Next billing date: <strong>${data.nextBillingDate}</strong>. Manage your subscription anytime from Settings → Billing.</p>
    `, `Your ${data.plan} subscription is active`),

  subscriptionCancelled: (data: { name: string; plan: string; accessUntil: string; resubscribeUrl: string }) =>
    base(`
      <h1>Subscription cancelled</h1>
      <p>Hi <strong style="color:#e2e8f0;">${data.name}</strong>,</p>
      <p>Your <span class="badge">${data.plan}</span> subscription has been cancelled. You'll retain full access until <strong style="color:#e2e8f0;">${data.accessUntil}</strong>.</p>
      <p>We're sorry to see you go. If there's anything we could have done better, reply to this email — we read every message.</p>
      <a href="${data.resubscribeUrl}" class="btn">Reactivate Subscription →</a>
    `, `Your ${data.plan} subscription has been cancelled`),

  paymentFailed: (data: { name: string; amount: string; updateUrl: string }) =>
    base(`
      <h1>Payment failed</h1>
      <p>Hi <strong style="color:#e2e8f0;">${data.name}</strong>,</p>
      <p>We were unable to process your payment of <strong style="color:#e2e8f0;">${data.amount}</strong>. Please update your payment method to avoid service interruption.</p>
      <a href="${data.updateUrl}" class="btn">Update Payment Method →</a>
      <hr class="divider">
      <p class="small">We'll retry the payment in 3 days. If the issue persists after 3 retries, your subscription will be paused.</p>
    `, `Action required: Payment failed`),

  agencyClientInvite: (data: { agencyName: string; clientName: string; setupUrl: string }) =>
    base(`
      <h1>Your AI workspace is ready</h1>
      <p>Hi <strong style="color:#e2e8f0;">${data.clientName}</strong>,</p>
      <p><strong style="color:#e2e8f0;">${data.agencyName}</strong> has set up a Hayya AI workspace for you. Click below to activate your account and start using AI-powered CRM.</p>
      <a href="${data.setupUrl}" class="btn">Activate Your Account →</a>
      <hr class="divider">
      <p class="small">Your workspace is managed by ${data.agencyName}. Contact them for billing or plan changes.</p>
    `, `${data.agencyName} set up your Hayya AI workspace`),

  aiAgentAlert: (data: { orgName: string; agentName: string; alertType: string; detail: string; dashboardUrl: string }) =>
    base(`
      <h1>AI Agent Alert</h1>
      <p>Workspace: <span class="badge">${data.orgName}</span></p>
      <p>Your AI agent <strong style="color:#e2e8f0;">${data.agentName}</strong> triggered an alert: <strong style="color:#fbbf24;">${data.alertType}</strong></p>
      <p style="background:#1a2235;padding:12px 16px;border-radius:8px;border-left:3px solid #fbbf24;color:#e2e8f0;font-size:13px;">${data.detail}</p>
      <a href="${data.dashboardUrl}" class="btn">Review in Dashboard →</a>
    `, `AI Agent alert: ${data.alertType}`),
}

export type TemplateKey = keyof typeof templates
