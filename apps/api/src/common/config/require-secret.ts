// Fail-fast secret accessor: in production, a missing secret crashes the app at
// boot instead of silently running with a publicly-known weak default.
export function requireSecret(envVar: string, devFallback: string): string {
  const value = process.env[envVar]
  if (value) return value
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required secret: ${envVar} (refusing to start in production without it)`)
  }
  return devFallback
}
