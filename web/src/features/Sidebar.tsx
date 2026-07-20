export function Sidebar() {
  return (
    <div
      style={{
        width: 'var(--sidebar-w)',
        background: 'var(--surface-panel)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%',
      }}
    >
      <div style={{ height: 'var(--header-h)', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--border-default)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '.02em' }}>
          FLEET
        </span>
      </div>
      <div style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            color: 'var(--accent-primary)',
            background: 'var(--surface-hover)',
          }}
        >
          <span style={{ width: 16, textAlign: 'center', opacity: 0.8 }}>◧</span>
          Dashboard
        </div>
      </div>
      <div style={{ marginTop: 'auto', padding: 16, borderTop: '1px solid var(--border-default)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
        SIMULATOR_TICK_MS=3000
        <br />
        KAFKA: telemetry.robot-movement
      </div>
    </div>
  );
}
