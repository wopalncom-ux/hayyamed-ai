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

async function request(path, options = {}) {
  const auth = getAuth()
  const headers = {
    'Content-Type': 'application/json',
    ...(auth.orgId ? { 'x-org-id': auth.orgId } : {}),
    ...(auth.userId ? { 'x-user-id': auth.userId } : {}),
    ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${BASE}/api/v1${path}`, { ...options, headers })
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

  // Reports / Dashboard
  getDashboard: () =>
    request('/reports/dashboard'),

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

  // Billing
  getInvoices: () =>
    request('/billing/invoices'),
  getPlans: () =>
    request('/billing/plans'),
  createCheckout: (planId) =>
    request('/billing/checkout', { method: 'POST', body: JSON.stringify({ planId }) }),
}
