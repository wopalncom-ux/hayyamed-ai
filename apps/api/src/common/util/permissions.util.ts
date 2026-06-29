// Client-portal RBAC. Roles are stored on User.clientRole; effective permissions
// are User.permissions (explicit) or the role defaults below.

export const CLIENT_PERMISSIONS = [
  'view_dashboard', 'view_inbox', 'reply_leads', 'use_ai_replies', 'toggle_ai',
  'assign_leads', 'change_status', 'add_notes', 'view_reports', 'export_reports',
  'manage_team', 'manage_integrations', 'manage_billing', 'view_campaign_cost',
  'launch_campaigns', 'approve_campaigns', 'delete_records',
] as const
export type ClientPermission = typeof CLIENT_PERMISSIONS[number]

export const CLIENT_ROLES = ['owner', 'manager', 'agent', 'viewer', 'billing'] as const
export type ClientRole = typeof CLIENT_ROLES[number]

export const CLIENT_ROLE_LABELS: Record<ClientRole, string> = {
  owner: 'Client Owner', manager: 'Manager', agent: 'Agent', viewer: 'Viewer', billing: 'Billing Viewer',
}

// Default permission set per role.
export const ROLE_DEFAULT_PERMISSIONS: Record<ClientRole, ClientPermission[]> = {
  owner: [...CLIENT_PERMISSIONS],
  manager: ['view_dashboard', 'view_inbox', 'reply_leads', 'use_ai_replies', 'toggle_ai', 'assign_leads', 'change_status', 'add_notes', 'view_reports', 'export_reports', 'manage_team', 'view_campaign_cost'],
  agent: ['view_inbox', 'reply_leads', 'use_ai_replies', 'add_notes', 'change_status'],
  viewer: ['view_dashboard', 'view_reports'],
  billing: ['manage_billing', 'view_campaign_cost'],
}

export function normalizeClientRole(role?: string | null): ClientRole {
  const r = String(role || '').toLowerCase()
  return (CLIENT_ROLES as readonly string[]).includes(r) ? (r as ClientRole) : 'owner'
}

// Effective permissions for a user: explicit list if present, else role defaults.
export function effectivePermissions(user: { clientRole?: string | null; permissions?: any }): ClientPermission[] {
  if (Array.isArray(user?.permissions) && user.permissions.length) {
    return user.permissions.filter((p: any) => (CLIENT_PERMISSIONS as readonly string[]).includes(p))
  }
  return ROLE_DEFAULT_PERMISSIONS[normalizeClientRole(user?.clientRole)]
}

export function hasPermission(user: { clientRole?: string | null; permissions?: any }, perm: ClientPermission): boolean {
  return effectivePermissions(user).includes(perm)
}
