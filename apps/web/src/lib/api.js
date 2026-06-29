const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function getAuth() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem('hayyamed_auth')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function patchAuth(patch) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem('hayyamed_auth', JSON.stringify({ ...getAuth(), ...patch })) } catch {}
}

// Single-flight refresh: the 15-min access token is renewed with the 7-day
// refresh token. Concurrent 401s share one in-flight refresh. Returns the new
// access token, or null if refresh isn't possible.
let _refreshPromise = null
function refreshAccessToken() {
  const { userId, refreshToken } = getAuth()
  if (!userId || !refreshToken) return Promise.resolve(null)
  if (!_refreshPromise) {
    _refreshPromise = fetch(`${BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, refreshToken }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.accessToken) { patchAuth({ accessToken: d.accessToken, refreshToken: d.refreshToken || refreshToken }); return d.accessToken }
        return null
      })
      .catch(() => null)
      .finally(() => { setTimeout(() => { _refreshPromise = null }, 0) })
  }
  return _refreshPromise
}

// Low-level authenticated fetch — attaches the session headers and transparently
// refreshes an expired token once, then retries. Returns the raw Response so it
// works for JSON, FormData uploads, and blob downloads alike. Does NOT force a
// Content-Type (so multipart/form-data boundaries are preserved).
export async function authFetch(path, options = {}, _retried = false) {
  const auth = getAuth()
  const headers = {
    ...(auth.orgId ? { 'x-org-id': auth.orgId } : {}),
    ...(auth.userId ? { 'x-user-id': auth.userId } : {}),
    ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${BASE}/api/v1${path}`, { ...options, headers })

  if (res.status === 401 && !_retried && !path.startsWith('/auth/')) {
    const newToken = await refreshAccessToken()
    if (newToken) return authFetch(path, options, true)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hayyamed_auth')
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login'
    }
  }
  return res
}

async function request(path, options = {}) {
  const res = await authFetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(err.message || 'Request failed')
  }
  return res.json()
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (dto) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(dto) }),
  forgotPassword: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, password) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),

  // Contacts
  getContacts: (params = {}) =>
    request('/contacts?' + new URLSearchParams(params)),
  getContactStats: () =>
    request('/contacts/stats'),
  createContact: (dto) =>
    request('/contacts', { method: 'POST', body: JSON.stringify(dto) }),
  updateContact: (id, dto) =>
    request(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteContact: (id) =>
    request(`/contacts/${id}`, { method: 'DELETE' }),
  bulkContacts: (ids, action, value) =>
    request('/contacts/bulk', { method: 'POST', body: JSON.stringify({ ids, action, value }) }),

  // Campaigns
  getCampaigns: (params = {}) =>
    request('/campaigns?' + new URLSearchParams(params)),
  getCampaignStats: () =>
    request('/campaigns/stats'),
  createCampaign: (dto) =>
    request('/campaigns', { method: 'POST', body: JSON.stringify(dto) }),
  updateCampaign: (id, dto) =>
    request(`/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteCampaign: (id) =>
    request(`/campaigns/${id}`, { method: 'DELETE' }),

  // Conversations (Inbox)
  getConversations: (params = {}) =>
    request('/conversations?' + new URLSearchParams(params)),
  getConversationStats: () =>
    request('/conversations/stats'),
  getMessages: (conversationId) =>
    request(`/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, content, senderId) =>
    request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, senderId }),
    }),
  updateConversationStatus: (id, status) =>
    request(`/conversations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  summarizeConversation: (id) =>
    request(`/conversations/${id}/summarize`, { method: 'POST' }),
  assignConversation: (id, assigneeId) =>
    request(`/conversations/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assigneeId }) }),
  setConversationTags: (id, tags) =>
    request(`/conversations/${id}/tags`, { method: 'PATCH', body: JSON.stringify({ tags }) }),
  setConversationAi: (id, paused) =>
    request(`/conversations/${id}/ai`, { method: 'PATCH', body: JSON.stringify({ paused }) }),
  exportConversation: (id) =>
    request(`/conversations/${id}/export`),
  getConversationNotes: (id) =>
    request(`/conversations/${id}/notes`),
  addConversationNote: (id, content) =>
    request(`/conversations/${id}/notes`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Reports / Dashboard
  getDashboard: () =>
    request('/reports/dashboard'),
  getAnalytics: (period = '7days') =>
    request(`/reports/analytics?period=${period}`),
  getFullStats: () =>
    request('/reports/full'),
  getOnboarding: () =>
    request('/reports/onboarding'),
  getToday: () =>
    request('/reports/today'),
  getCsat: () =>
    request('/reports/csat'),
  // Outbound webhooks
  getWebhooks: () =>
    request('/webhooks'),
  createWebhook: (url, events) =>
    request('/webhooks', { method: 'POST', body: JSON.stringify({ url, events }) }),
  testWebhook: (url) =>
    request('/webhooks/test', { method: 'POST', body: JSON.stringify({ url }) }),
  deleteWebhook: (id) =>
    request(`/webhooks/${id}`, { method: 'DELETE' }),
  // API keys (public inbound API)
  getApiKeys: () =>
    request('/api-keys'),
  createApiKey: (name) =>
    request('/api-keys', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteApiKey: (id) =>
    request(`/api-keys/${id}`, { method: 'DELETE' }),
  getSalesReport: () =>
    request('/reports/sales'),

  // Chatbots
  getChatbots: () =>
    request('/chatbots'),
  createChatbot: (dto) =>
    request('/chatbots', { method: 'POST', body: JSON.stringify(dto) }),
  updateChatbot: (id, dto) =>
    request(`/chatbots/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  publishChatbot: (id) =>
    request(`/chatbots/${id}/publish`, { method: 'POST' }),
  deleteChatbot: (id) =>
    request(`/chatbots/${id}`, { method: 'DELETE' }),
  getKnowledge: (id) =>
    request(`/chatbots/${id}/knowledge`),
  addKnowledgeUrl: (id, url) =>
    request(`/chatbots/${id}/knowledge/url`, { method: 'POST', body: JSON.stringify({ url }) }),
  removeKnowledgeDoc: (id, index) =>
    request(`/chatbots/${id}/knowledge/${index}`, { method: 'DELETE' }),
  getActiveKnowledge: () =>
    request('/chatbots/knowledge/active'),

  // Settings
  getSettings: () =>
    request('/settings'),
  saveSettings: (dto) =>
    request('/settings', { method: 'PATCH', body: JSON.stringify(dto) }),
  getProfile: () =>
    request('/users/me'),
  updateProfile: (dto) =>
    request('/users/me', { method: 'PATCH', body: JSON.stringify(dto) }),
  changePassword: (currentPassword, newPassword) =>
    request('/users/me/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  getTeam: () =>
    request('/users/team'),

  // MyFatoorah payments
  getMyFatoorahStatus: () =>
    request('/payments/myfatoorah/status'),
  saveMyFatoorahConfig: (apiToken, isTest, country) =>
    request('/payments/myfatoorah/config', { method: 'POST', body: JSON.stringify({ apiToken, isTest, country }) }),
  disconnectMyFatoorah: () =>
    request('/payments/myfatoorah/disconnect', { method: 'POST' }),
  createMyFatoorahPayment: (dto) =>
    request('/payments/myfatoorah/pay', { method: 'POST', body: JSON.stringify(dto) }),
  getMyFatoorahPayments: () =>
    request('/payments/myfatoorah/payments'),
  getMyFatoorahSummary: () =>
    request('/payments/myfatoorah/summary'),
  // Platform billing account (collects tenant subscription payments)
  getMyFatoorahPlatformStatus: () =>
    request('/payments/myfatoorah/platform-status'),
  saveMyFatoorahPlatformConfig: (apiToken, isTest, country) =>
    request('/payments/myfatoorah/platform-config', { method: 'POST', body: JSON.stringify({ apiToken, isTest, country }) }),
  disconnectMyFatoorahPlatform: () =>
    request('/payments/myfatoorah/platform-disconnect', { method: 'POST' }),
  refreshMyFatoorahPayment: (id) =>
    request(`/payments/myfatoorah/payments/${id}/refresh`, { method: 'POST' }),

  // Saved Replies (canned responses)
  getQuickReplies: () =>
    request('/quick-replies'),
  createQuickReply: (title, content) =>
    request('/quick-replies', { method: 'POST', body: JSON.stringify({ title, content }) }),
  updateQuickReply: (id, dto) =>
    request(`/quick-replies/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteQuickReply: (id) =>
    request(`/quick-replies/${id}`, { method: 'DELETE' }),
  inviteTeamMember: (email, role) =>
    request('/users/team/invite', { method: 'POST', body: JSON.stringify({ email, role }) }),

  // Billing
  getInvoices: () =>
    request('/billing/invoices'),
  getPlans: () =>
    request('/billing/plans'),
  updatePlans: (plans) =>
    request('/billing/plans', { method: 'PATCH', body: JSON.stringify({ plans }) }),
  getPlansWithCost: () =>
    request('/billing/plans-cost'),
  updateCostModel: (model) =>
    request('/billing/cost-model', { method: 'PATCH', body: JSON.stringify(model) }),
  getCurrentPlan: () =>
    request('/billing/current-plan'),
  createCheckout: (planId) =>
    request('/billing/checkout', { method: 'POST', body: JSON.stringify({ planId }) }),
  verifySubscription: (paymentId) =>
    request(`/billing/verify?paymentId=${encodeURIComponent(paymentId)}`),

  // Notifications
  getNotifications: (params = {}) =>
    request('/notifications?' + new URLSearchParams(params)),
  markNotificationRead: (id) =>
    request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request('/notifications/read-all', { method: 'PATCH' }),
  deleteNotification: (id) =>
    request(`/notifications/${id}`, { method: 'DELETE' }),

  // AI Agents
  getAgents: () =>
    request('/ai-agents'),
  getAgent: (id) =>
    request(`/ai-agents/${id}`),
  createAgent: (dto) =>
    request('/ai-agents', { method: 'POST', body: JSON.stringify(dto) }),
  updateAgent: (id, dto) =>
    request(`/ai-agents/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteAgent: (id) =>
    request(`/ai-agents/${id}`, { method: 'DELETE' }),
  toggleAgent: (id, isActive) =>
    request(`/ai-agents/${id}/toggle`, { method: 'POST', body: JSON.stringify({ isActive }) }),
  testAgent: (id, message, history = []) =>
    request(`/ai-agents/${id}/test`, { method: 'POST', body: JSON.stringify({ message, history }) }),

  // Knowledge Base
  getKnowledgeBases: () =>
    request('/knowledge-bases'),
  getKnowledgeGaps: () =>
    request('/knowledge-bases/gaps'),
  clearKnowledgeGaps: () =>
    request('/knowledge-bases/gaps', { method: 'DELETE' }),
  getKnowledgeBase: (id) =>
    request(`/knowledge-bases/${id}`),
  createKnowledgeBase: (dto) =>
    request('/knowledge-bases', { method: 'POST', body: JSON.stringify(dto) }),
  addKnowledgeSource: (id, dto) =>
    request(`/knowledge-bases/${id}/sources`, { method: 'POST', body: JSON.stringify(dto) }),
  deleteKnowledgeSource: (id, sourceId) =>
    request(`/knowledge-bases/${id}/sources/${sourceId}`, { method: 'DELETE' }),
  reindexKnowledge: (id) =>
    request(`/knowledge-bases/${id}/reindex`, { method: 'POST' }),
  uploadKnowledgeFile: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return authFetch(`/knowledge-bases/${id}/upload`, { method: 'POST', body: form })
      .then(async r => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || 'Upload failed'); return r.json() })
  },
  searchKnowledge: (id, query, topK = 5) =>
    request(`/knowledge-bases/${id}/search`, { method: 'POST', body: JSON.stringify({ query, topK }) }),

  // Bookings
  getBookings: (params = {}) =>
    request('/bookings?' + new URLSearchParams(params)),
  createBooking: (dto) =>
    request('/bookings', { method: 'POST', body: JSON.stringify(dto) }),
  updateBooking: (id, dto) =>
    request(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  cancelBooking: (id) =>
    request(`/bookings/${id}/cancel`, { method: 'POST' }),

  // AI Actions
  generateReply: (conversationId) =>
    request('/ai/reply', { method: 'POST', body: JSON.stringify({ conversationId }) }),
  scoreLead: (contactId) =>
    request('/ai/score', { method: 'POST', body: JSON.stringify({ contactId }) }),
  scoreAllContacts: () =>
    request('/ai/score-all', { method: 'POST', body: JSON.stringify({}) }),
  generateCampaignMessage: (prompt, tone, language) =>
    request('/ai/campaign-message', { method: 'POST', body: JSON.stringify({ prompt, tone, language }) }),
  getInsights: (metrics) =>
    request('/ai/insights', { method: 'POST', body: JSON.stringify({ metrics }) }),
  getAiProviders: () =>
    request('/ai/providers'),
  testAiProvider: (provider, model, prompt) =>
    request('/ai/test-provider', { method: 'POST', body: JSON.stringify({ provider, model, prompt }) }),

  // Branches
  getBranches: () =>
    request('/branches'),
  createBranch: (dto) =>
    request('/branches', { method: 'POST', body: JSON.stringify(dto) }),

  // Integrations
  getIntegrations: () =>
    request('/integrations'),
  saveIntegration: (type, name, credentials) =>
    request(`/integrations/${type}`, { method: 'PATCH', body: JSON.stringify({ name, credentials }) }),
  disconnectIntegration: (type) =>
    request(`/integrations/${type}/disconnect`, { method: 'POST' }),

  // Telegram channel
  connectTelegram: (botToken) =>
    request('/telegram/connect', { method: 'POST', body: JSON.stringify({ botToken }) }),
  getTelegramStatus: () =>
    request('/telegram/status'),
  disconnectTelegram: () =>
    request('/telegram/disconnect', { method: 'POST' }),

  // Agency
  getAgencyStats: () =>
    request('/agency/stats'),
  getAgencyClients: () =>
    request('/agency/clients'),
  getAgencyClient: (id) =>
    request(`/agency/clients/${id}`),
  getAgencyOverview: () =>
    request('/agency/overview'),
  getAgencyAuditLogs: () =>
    request('/agency/audit-logs'),
  setAgencyClientActive: (id, isActive) =>
    request(`/agency/clients/${id}/active`, { method: 'POST', body: JSON.stringify({ isActive }) }),
  getClientBrains: (id) =>
    request(`/agency/clients/${id}/brains`),
  getClientStorage: (id) =>
    request(`/agency/clients/${id}/storage`),
  createClientBrain: (id, dto) =>
    request(`/agency/clients/${id}/brains`, { method: 'POST', body: JSON.stringify(dto) }),
  addClientSource: (id, kbId, dto) =>
    request(`/agency/clients/${id}/brains/${kbId}/sources`, { method: 'POST', body: JSON.stringify(dto) }),
  removeClientSource: (id, kbId, sourceId) =>
    request(`/agency/clients/${id}/brains/${kbId}/sources/${sourceId}`, { method: 'DELETE' }),
  retrainClientBrain: (id, kbId) =>
    request(`/agency/clients/${id}/brains/${kbId}/retrain`, { method: 'POST' }),
  uploadClientFile: (id, kbId, file) => {
    const form = new FormData()
    form.append('file', file)
    return authFetch(`/agency/clients/${id}/brains/${kbId}/upload`, { method: 'POST', body: form })
      .then(async r => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || 'Upload failed'); return r.json() })
  },
  getClientAgents: (id) =>
    request(`/agency/clients/${id}/agents`),
  createClientAgent: (id, dto) =>
    request(`/agency/clients/${id}/agents`, { method: 'POST', body: JSON.stringify(dto) }),
  updateClientAgent: (id, agentId, dto) =>
    request(`/agency/clients/${id}/agents/${agentId}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  removeClientAgent: (id, agentId) =>
    request(`/agency/clients/${id}/agents/${agentId}`, { method: 'DELETE' }),
  toggleClientAgent: (id, agentId, isActive) =>
    request(`/agency/clients/${id}/agents/${agentId}/toggle`, { method: 'POST', body: JSON.stringify({ isActive }) }),
  testClientAgent: (id, agentId, message, history) =>
    request(`/agency/clients/${id}/agents/${agentId}/test`, { method: 'POST', body: JSON.stringify({ message, history }) }),
  getClientChannels: (id) =>
    request(`/agency/clients/${id}/channels`),
  clientUnipileStatus: (id) =>
    request(`/agency/clients/${id}/channels/unipile/status`),
  connectClientUnipile: (id, pairingPhone) =>
    request(`/agency/clients/${id}/channels/unipile/connect`, { method: 'POST', body: JSON.stringify({ pairingPhone }) }),
  connectClientMeta: (id, dto) =>
    request(`/agency/clients/${id}/channels/meta`, { method: 'POST', body: JSON.stringify(dto) }),
  connectClientManual: (id, dto) =>
    request(`/agency/clients/${id}/channels/manual`, { method: 'POST', body: JSON.stringify(dto) }),
  connectClientInstagram: (id, dto) =>
    request(`/agency/clients/${id}/channels/instagram`, { method: 'POST', body: JSON.stringify(dto) }),
  disconnectClientChannel: (id, channelId) =>
    request(`/agency/clients/${id}/channels/${channelId}`, { method: 'DELETE' }),
  getAutomationTemplates: () =>
    request('/agency/automation-templates'),
  getClientAutomations: (id) =>
    request(`/agency/clients/${id}/automations`),
  getClientAutomationRuns: (id) =>
    request(`/agency/clients/${id}/automation-runs`),
  installClientTemplate: (id, templateId) =>
    request(`/agency/clients/${id}/automations/install`, { method: 'POST', body: JSON.stringify({ templateId }) }),
  toggleClientAutomation: (id, wfId, isActive) =>
    request(`/agency/clients/${id}/automations/${wfId}/toggle`, { method: 'POST', body: JSON.stringify({ isActive }) }),
  removeClientAutomation: (id, wfId) =>
    request(`/agency/clients/${id}/automations/${wfId}`, { method: 'DELETE' }),
  getModuleCatalog: () =>
    request('/agency/module-catalog'),
  getClientModules: (id) =>
    request(`/agency/clients/${id}/modules`),
  setClientModule: (id, moduleKey, enabled) =>
    request(`/agency/clients/${id}/modules/${moduleKey}`, { method: 'POST', body: JSON.stringify({ enabled }) }),
  getClientBilling: (id) =>
    request(`/agency/clients/${id}/billing`),
  chargeClient: (id, providerCost, description) =>
    request(`/agency/clients/${id}/charge`, { method: 'POST', body: JSON.stringify({ providerCost, description }) }),
  setClientLowBalance: (id, threshold) =>
    request(`/agency/clients/${id}/low-balance`, { method: 'POST', body: JSON.stringify({ threshold }) }),
  createAgencyClient: (dto) =>
    request('/agency/clients', { method: 'POST', body: JSON.stringify(dto) }),
  updateAgencyClient: (id, dto) =>
    request(`/agency/clients/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  topUpAgencyClient: (id, amount) =>
    request(`/agency/clients/${id}/top-up`, { method: 'POST', body: JSON.stringify({ amount }) }),
  deleteAgencyClient: (id) =>
    request(`/agency/clients/${id}`, { method: 'DELETE' }),
  getAgencyPackages: () =>
    request('/agency/packages'),
  createAgencyPackage: (dto) =>
    request('/agency/packages', { method: 'POST', body: JSON.stringify(dto) }),
  updateAgencyPackage: (id, dto) =>
    request(`/agency/packages/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteAgencyPackage: (id) =>
    request(`/agency/packages/${id}`, { method: 'DELETE' }),

  // Workflows / Automations
  getWorkflows: () =>
    request('/workflows'),
  getWorkflow: (id) =>
    request(`/workflows/${id}`),
  getWorkflowStats: () =>
    request('/workflows/stats'),
  getWorkflowRuns: (params = {}) =>
    request('/workflows/runs?' + new URLSearchParams(params)),
  createWorkflow: (dto) =>
    request('/workflows', { method: 'POST', body: JSON.stringify(dto) }),
  updateWorkflow: (id, dto) =>
    request(`/workflows/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  toggleWorkflow: (id, isActive) =>
    request(`/workflows/${id}/toggle`, { method: 'POST', body: JSON.stringify({ isActive }) }),
  testFireWorkflow: (id, body) =>
    request(`/workflows/${id}/test`, { method: 'POST', body: JSON.stringify(body) }),
  deleteWorkflow: (id) =>
    request(`/workflows/${id}`, { method: 'DELETE' }),

  // Master Admin (SUPER_ADMIN only)
  getMasterStats: () =>
    request('/master-admin/stats'),
  getSystemHealth: () =>
    request('/master-admin/health'),
  getPlatformBilling: () =>
    request('/master-admin/billing'),
  getMasterOrgs: (params = {}) =>
    request('/master-admin/orgs?' + new URLSearchParams(params)),
  getMasterOrg: (id) =>
    request(`/master-admin/orgs/${id}`),
  updateMasterOrg: (id, dto) =>
    request(`/master-admin/orgs/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  suspendMasterOrg: (id) =>
    request(`/master-admin/orgs/${id}/suspend`, { method: 'POST' }),
  createMasterOrg: (dto) =>
    request('/master-admin/orgs', { method: 'POST', body: JSON.stringify(dto) }),
  getMasterAuditLogs: (params = {}) =>
    request('/master-admin/audit-logs?' + new URLSearchParams(params)),

  // Pipeline
  getPipelineContacts: (params = {}) => request('/contacts/pipeline?' + new URLSearchParams(params)),

  // Contact Profile & Notes
  getContactProfile: (id) => request(`/contacts/${id}/profile`),
  addContactNote: (id, body) => request(`/contacts/${id}/notes`, { method: 'POST', body: JSON.stringify(body) }),
  deleteContactNote: (contactId, noteId) => request(`/contacts/${contactId}/notes/${noteId}`, { method: 'DELETE' }),

  // Contact Import / Export
  previewContactImport: (file) => {
    const form = new FormData()
    form.append('file', file)
    return authFetch('/contacts/import/preview', { method: 'POST', body: form }).then(r => r.json())
  },
  exportContactsCsv: (params = {}) => {
    const qs = new URLSearchParams(params)
    return authFetch(`/contacts/export/csv?${qs}`)
  },

  // Campaign Execution Engine
  getCampaign: (id) => request(`/campaigns/${id}`),
  updateCampaign: (id, body) => request(`/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getCampaignAnalytics: (id) => request(`/campaigns/${id}/analytics`),
  getCampaignContacts: (id, params = {}) => request(`/campaigns/${id}/contacts?` + new URLSearchParams(params)),
  addContactsByFilter: (id, body) => request(`/campaigns/${id}/contacts/filter`, { method: 'POST', body: JSON.stringify(body) }),
  addContactsToCampaign: (id, body) => request(`/campaigns/${id}/contacts`, { method: 'POST', body: JSON.stringify(body) }),
  launchCampaign: (id) => request(`/campaigns/${id}/launch`, { method: 'POST' }),
  pauseCampaign: (id) => request(`/campaigns/${id}/pause`, { method: 'POST' }),
  resumeCampaign: (id) => request(`/campaigns/${id}/resume`, { method: 'POST' }),
  scheduleCampaign: (id, body) => request(`/campaigns/${id}/schedule`, { method: 'POST', body: JSON.stringify(body) }),

  // WhatsApp
  getWhatsAppChannels: () => request('/whatsapp/channels'),
  connectWhatsApp: (body) => request('/whatsapp/channels', { method: 'POST', body: JSON.stringify(body) }),
  disconnectWhatsApp: (id) => request(`/whatsapp/channels/${id}`, { method: 'DELETE' }),
  testWhatsApp: (body) => request('/whatsapp/channels/test', { method: 'POST', body: JSON.stringify(body) }),

  // WhatsApp via Unipile (QR connect — no Meta approval)
  unipilePlatformStatus: () => request('/unipile/platform-status'),
  saveUnipilePlatform: (dsn, apiKey) => request('/unipile/platform-config', { method: 'POST', body: JSON.stringify({ dsn, apiKey }) }),
  unipileWhatsAppStatus: () => request('/unipile/whatsapp/status'),
  unipileWhatsAppConnect: (pairingPhone) => request('/unipile/whatsapp/connect', { method: 'POST', body: JSON.stringify({ pairingPhone }) }),
  unipileWhatsAppDisconnect: () => request('/unipile/whatsapp/disconnect', { method: 'POST' }),
  sendWhatsApp: (body) => request('/whatsapp/send', { method: 'POST', body: JSON.stringify(body) }),
  broadcastWhatsApp: (body) => request('/whatsapp/broadcast', { method: 'POST', body: JSON.stringify(body) }),

  // Email
  testEmail: (body) => request('/master-admin/email/test', { method: 'POST', body: JSON.stringify(body) }),

  // Marketplace
  getMarketplaceItems: (params = {}) =>
    request('/marketplace?' + new URLSearchParams(params)),
  getMarketplaceItem: (id) => request(`/marketplace/${id}`),
  installMarketplaceItem: (id) => request(`/marketplace/${id}/install`, { method: 'POST' }),
  uninstallMarketplaceItem: (id) => request(`/marketplace/${id}/install`, { method: 'DELETE' }),
  getInstalledItems: () => request('/marketplace/installed'),
  rateMarketplaceItem: (id, rating) =>
    request(`/marketplace/${id}/rate`, { method: 'POST', body: JSON.stringify({ rating }) }),
  getMarketplaceStats: () => request('/master-admin/marketplace/stats'),

  // Audit Dashboard
  getPlatformAuditLogs: (params = {}) =>
    request('/master-admin/audit?' + new URLSearchParams(params)),
  getAuditStats: (days = 30) =>
    request(`/master-admin/audit/stats?days=${days}`),
  getMyAuditLogs: (params = {}) =>
    request('/audit?' + new URLSearchParams(params)),

  // AI Quality Engine
  getMasterAIQuality: (days = 30) =>
    request(`/master-admin/ai-quality?days=${days}`),
  getAllOrgAIQuality: (days = 30) =>
    request(`/master-admin/ai-quality/orgs?days=${days}`),
  getOrgAIQuality: (orgId, days = 30) =>
    request(`/master-admin/ai-quality/orgs/${orgId}?days=${days}`),
  getMyAIQuality: (days = 30) =>
    request(`/ai/quality?days=${days}`),

  // Customer Health
  getCustomerHealth: () =>
    request('/master-admin/customer-health'),
  getAllCustomerHealth: () =>
    request('/master-admin/customer-health/all'),
  getOrgHealth: (orgId) =>
    request(`/master-admin/customer-health/${orgId}`),

  // AI Observability
  getAIObservabilityStats: (days = 30) =>
    request(`/ai/observability/stats?days=${days}`),
  getMasterAIObservabilityStats: (days = 30) =>
    request(`/master-admin/ai-observability/stats?days=${days}`),
  recordAIFeedback: (id, feedback) =>
    request(`/ai/observability/feedback/${id}`, { method: 'POST', body: JSON.stringify({ feedback }) }),

  // Feature Flags (Master Admin)
  getFeatureFlags: () =>
    request('/master-admin/feature-flags'),
  updateFeatureFlag: (key, dto) =>
    request(`/master-admin/feature-flags/${key}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  setOrgFeatureFlag: (orgId, key, isEnabled) =>
    request(`/master-admin/feature-flags/orgs/${orgId}/${key}`, { method: 'POST', body: JSON.stringify({ isEnabled }) }),
  removeOrgFeatureFlag: (orgId, key) =>
    request(`/master-admin/feature-flags/orgs/${orgId}/${key}`, { method: 'DELETE' }),
  getOrgFeatureFlagOverrides: (orgId) =>
    request(`/master-admin/feature-flags/orgs/${orgId}`),

  // ── Client Portal (self-service, scoped to the caller's org) ──────────────
  getContactProfile: (id) => request(`/contacts/${id}/profile`),
  createClientPortalUser: (id, dto) => request(`/agency/clients/${id}/portal-user`, { method: 'POST', body: JSON.stringify(dto) }),
  getPortalMe: () => request('/portal/me'),
  getPortalTeamCatalog: () => request('/portal/team/catalog'),
  getPortalTeam: () => request('/portal/team'),
  invitePortalMember: (dto) => request('/portal/team', { method: 'POST', body: JSON.stringify(dto) }),
  updatePortalMember: (id, dto) => request(`/portal/team/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  removePortalMember: (id) => request(`/portal/team/${id}`, { method: 'DELETE' }),
}
