export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  active?: string;
  onChange?: (value: string) => void;
}

export function Tabs({ tabs = [], active, onChange }: TabsProps) {
  return (
    <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border-default)' }}>
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange?.(t.value)}
          style={{
            padding: '8px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            background: 'transparent',
            border: 'none',
            borderBottom: '2px solid ' + (active === t.value ? 'var(--accent-primary)' : 'transparent'),
            color: active === t.value ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wide)',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
