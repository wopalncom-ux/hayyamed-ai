// Consistent, on-brand empty state for lists/panels across the app.
export default function EmptyState({ icon = '✨', title, hint, action, compact = false }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: compact ? '20px 16px' : '40px 24px', gap: '8px',
    }}>
      <div style={{
        width: compact ? '40px' : '52px', height: compact ? '40px' : '52px', borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: compact ? '20px' : '24px',
        background: 'rgba(216,177,106,.08)', border: '1px solid rgba(216,177,106,.2)',
      }}>{icon}</div>
      {title && <div style={{ fontSize: compact ? '13px' : '15px', fontWeight: 700, color: '#e2e8f0', marginTop: '4px' }}>{title}</div>}
      {hint && <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6, maxWidth: '320px' }}>{hint}</div>}
      {action && (
        <a href={action.href} style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700, color: '#070b0a', background: '#D8B16A', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}>
          {action.label}
        </a>
      )}
    </div>
  )
}
