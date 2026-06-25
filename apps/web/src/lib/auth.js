export function getAuth() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem('hayyamed_auth') || '{}') } catch { return {} }
}

// Backend roles are uppercase (SUPER_ADMIN, ADMIN, ...); the UI uses lowercase
// nav roles (owner, manager, ...). Normalize so both formats resolve correctly.
export function normalizeRole(role) {
  const r = String(role || '').toLowerCase()
  if (['owner', 'super_admin', 'admin', 'agency_admin'].includes(r)) return 'owner'
  if (r === 'manager') return 'manager'
  if (r === 'marketing') return 'marketing'
  if (['receptionist', 'agent', 'viewer'].includes(r)) return 'receptionist'
  if (r === 'client') return 'client'
  return r || 'manager'
}

// True for any owner-level role, regardless of stored format.
export function isOwnerRole(role) {
  return normalizeRole(role) === 'owner'
}

export function logout() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('hayyamed_auth')
  document.cookie = 'hayyamed_session=; path=/; max-age=0'
  window.location.href = '/login'
}

// What each role can see in the sidebar
export const ROLE_NAV = {
  owner:        ['dashboard','inbox','contacts','pipeline','analytics','reports','campaigns','agents','knowledge','bookings','chatbot','workflows','marketplace','notifications','agency','integrations','admin','settings'],
  manager:      ['dashboard','inbox','contacts','pipeline','analytics','reports','campaigns','chatbot','workflows','notifications','settings'],
  marketing:    ['dashboard','inbox','contacts','pipeline','analytics','reports','campaigns','notifications','settings'],
  receptionist: ['dashboard','inbox','contacts','notifications','settings'],
  client:       ['client'],
}

export function canSee(page) {
  const { role = 'owner' } = getAuth()
  const allowed = ROLE_NAV[normalizeRole(role)] || ROLE_NAV.owner
  return allowed.includes(page)
}

export const ROLE_LABELS = {
  owner:        { label:'Owner / Admin',      color:'#00e5a0' },
  manager:      { label:'Client Manager',     color:'#f97316' },
  marketing:    { label:'Marketing Manager',  color:'#a78bfa' },
  receptionist: { label:'Receptionist',       color:'#3b82f6' },
  client:       { label:'Client Portal',      color:'#06b6d4' },
}
