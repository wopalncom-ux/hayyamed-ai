// Rule-based lead score (0–100). A free, deterministic baseline that makes the
// score meaningful without an AI call; on-demand AI scoring can still refine it.
const STATUS_BASE: Record<string, number> = {
  NEW: 20, CONTACTED: 40, QUALIFYING: 55, QUALIFIED: 70,
  PROPOSAL: 80, NEGOTIATION: 88, WON: 100, LOST: 5,
}

export function statusFloor(status?: string): number {
  return STATUS_BASE[String(status || 'NEW')] ?? 20
}

// Initial score for a new contact: pipeline stage + contactability signals.
export function computeLeadScore(c: { status?: string; email?: string | null; name?: string | null; value?: any }): number {
  let s = statusFloor(c.status)
  if (c.email) s += 8
  if (c.name) s += 5
  if (Number(c.value) > 0) s += 7
  return Math.max(0, Math.min(100, s))
}
