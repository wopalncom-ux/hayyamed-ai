import { ImageResponse } from 'next/og'

// Branded 1200×630 social card. Generated dynamically (not at build time) to
// avoid the static-prerender font fetch; edge runtime bundles the default font.
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const alt = 'Hayya AI — AI Agents for WhatsApp, Instagram & CRM'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const DARK = '#070b0a'
const GOLD = '#D8B16A'
const BURG = '#5A1026'

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: '64px 72px',
          background: DARK, color: '#fff', fontFamily: 'sans-serif', position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: -180, left: 320, width: 760, height: 480, background: 'radial-gradient(closest-side, rgba(216,177,106,0.28), transparent)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -220, right: -120, width: 640, height: 540, background: `radial-gradient(closest-side, ${BURG}, transparent)`, opacity: 0.55, display: 'flex' }} />

        {/* wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 30, fontWeight: 800, letterSpacing: 1 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: GOLD, marginRight: 14, display: 'flex' }} />
          <div style={{ display: 'flex' }}>
            <span>HAYYA</span>
            <span style={{ color: GOLD }}>&nbsp;AI</span>
          </div>
        </div>

        {/* headline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 22, fontWeight: 700, letterSpacing: 6, color: GOLD, marginBottom: 20 }}>AI OPERATING PLATFORM</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 980 }}>
            <span>Build. Automate. Scale with AI</span>
            <span style={{ color: GOLD }}>.</span>
          </div>
          <div style={{ display: 'flex', fontSize: 27, color: 'rgba(255,255,255,0.72)', marginTop: 24, maxWidth: 900, lineHeight: 1.4 }}>
            AI agents, WhatsApp automation, omnichannel CRM and your own AI Brain — one platform.
          </div>
        </div>

        {/* footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 22, color: 'rgba(255,255,255,0.6)' }}>
          <span style={{ color: GOLD, fontWeight: 700 }}>hayyaai.com</span>
          <span>Built and operated by Hayya Med AI · Doha, Qatar</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
