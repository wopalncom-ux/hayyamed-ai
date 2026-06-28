// Ambient "AI solution" backdrop — animated gradient orbs + a drifting neural
// grid. Pure CSS (GPU transform/opacity), no JS, behind content (zIndex 0).
export default function AiBackdrop() {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      {/* drifting neural grid */}
      <div style={{
        position: 'absolute', inset: '-2px',
        backgroundImage: 'linear-gradient(#1a2235 1px, transparent 1px), linear-gradient(90deg, #1a2235 1px, transparent 1px)',
        backgroundSize: '48px 48px', opacity: 0.25,
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 75%)',
        animation: 'hai-grid 14s linear infinite',
      }} />
      {/* gradient orbs — brand crimson + gold */}
      <div className="hai-orb" style={{ width: 420, height: 420, top: -120, left: '8%', background: 'rgba(124,21,53,.30)', animation: 'hai-drift 16s ease-in-out infinite' }} />
      <div className="hai-orb" style={{ width: 360, height: 360, top: 40, right: '6%', background: 'rgba(201,169,110,.22)', animation: 'hai-float 12s ease-in-out infinite' }} />
      <div className="hai-orb" style={{ width: 300, height: 300, bottom: -80, left: '38%', background: 'rgba(168,29,69,.20)', animation: 'hai-float2 18s ease-in-out infinite' }} />
    </div>
  )
}
