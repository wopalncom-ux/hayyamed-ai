// Business-hours check, timezone-aware. workingHours shape:
//   { enabled: boolean, timezone: string, days: { '0'..'6': { off?: boolean, open: 'HH:mm', close: 'HH:mm' } } }
// Day index follows JS getDay(): 0 = Sunday … 6 = Saturday.
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function isWithinHours(wh: any, now: Date = new Date()): boolean {
  // Not configured / not enabled → treat as always open (no behaviour change).
  if (!wh || !wh.enabled || !wh.days) return true
  const tz = wh.timezone || 'Asia/Qatar'
  let wd = 'Sun', hh = '00', mm = '00'
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(now)
    wd = parts.find(p => p.type === 'weekday')?.value || 'Sun'
    hh = parts.find(p => p.type === 'hour')?.value || '00'
    mm = parts.find(p => p.type === 'minute')?.value || '00'
  } catch { return true }
  if (hh === '24') hh = '00'
  const idx = WD.indexOf(wd)
  const day = wh.days[String(idx)] ?? wh.days[idx]
  if (!day || day.off) return false
  const cur = `${hh}:${mm}`
  return cur >= (day.open || '00:00') && cur <= (day.close || '23:59')
}
