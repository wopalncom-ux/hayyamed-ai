export function getAuth() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem('hayyamed_auth') || '{}') } catch { return {} }
}

export function logout() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('hayyamed_auth')
  document.cookie = 'hayyamed_session=; path=/; max-age=0'
  window.location.href = '/login'
}

// What each role can see in the sidebar
export const ROLE_NAV = {
  owner:        ['dashboard','inbox','contacts','analytics','reports','campaigns','chatbot','notifications','agency','integrations','settings'],
  manager:      ['dashboard','inbox','contacts','analytics','reports','campaigns','chatbot','notifications','settings'],
  marketing:    ['dashboard','inbox','contacts','analytics','reports','campaigns','notifications','settings'],
  receptionist: ['dashboard','inbox','contacts','notifications','settings'],
  client:       ['client'],
}

export function canSee(page) {
  const { role = 'owner' } = getAuth()
  const allowed = ROLE_NAV[role] || ROLE_NAV.owner
  return allowed.includes(page)
}

export const ROLE_LABELS = {
  owner:        { label:'Owner / Admin',      color:'#00e5a0' },
  manager:      { label:'Client Manager',     color:'#f97316' },
  marketing:    { label:'Marketing Manager',  color:'#a78bfa' },
  receptionist: { label:'Receptionist',       color:'#3b82f6' },
  client:       { label:'Client Portal',      color:'#06b6d4' },
}

// Demo users (used as fallback when backend is not running)
export const DEMO_USERS = [
  { email:'admin@hayyamed.ai',      password:'Admin@2025',      role:'owner',        name:'Abbas Al Masri',        orgId:'e228e9fb-53f6-42a4-b6bd-201eace467a4' },
  { email:'manager@hayyamed.ai',    password:'Manager@2025',    role:'manager',      name:'Ahmad Singa',           orgId:'e228e9fb-53f6-42a4-b6bd-201eace467a4' },
  { email:'marketing@hayyamed.ai',  password:'Marketing@2025',  role:'marketing',    name:'Khaled Ahmad',          orgId:'e228e9fb-53f6-42a4-b6bd-201eace467a4' },
  { email:'reception@hayyamed.ai',  password:'Reception@2025',  role:'receptionist', name:'Sara Kayan',            orgId:'e228e9fb-53f6-42a4-b6bd-201eace467a4' },
  { email:'elite@hayyamed.ai',      password:'Elite@2025',      role:'client',       name:'Elite Medical Center',  orgId:'elite-001' },
]
