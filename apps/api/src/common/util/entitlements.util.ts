import { PrismaService } from '../../database/prisma.service'

// Per-client module entitlement check. A module is ENABLED unless the owner has
// explicitly turned it OFF (organizations.modules[key].enabled === false). This
// keeps self-serve / unmanaged orgs (modules = null) at full access, while
// agency-managed clients are gated by their toggles.
export async function isModuleEnabled(prisma: PrismaService, orgId: string, key: string): Promise<boolean> {
  try {
    const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { modules: true } })
    const m = (org?.modules as any)?.[key]
    return m?.enabled !== false
  } catch {
    return true // never block on a lookup error
  }
}
