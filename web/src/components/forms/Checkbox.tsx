import type { CSSProperties, ReactNode } from 'react';

export interface CheckboxChangeEvent {
  target: { checked: boolean };
}

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (e: CheckboxChangeEvent) => void;
  label?: ReactNode;
  style?: CSSProperties;
}

export function Checkbox({ checked, onChange, label, style }: CheckboxProps) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
        ...style,
      }}
    >
      <span
        onClick={() => onChange?.({ target: { checked: !checked } })}
        style={{
          width: 16,
          height: 16,
          border: '1px solid ' + (checked ? 'var(--accent-primary)' : 'var(--border-strong)'),
          background: checked ? 'var(--accent-primary)' : 'transparent',
          borderRadius: 'var(--radius-xs)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {checked ? <span style={{ color: 'var(--accent-primary-fg)', fontSize: 11, lineHeight: 1 }}>✓</span> : null}
      </span>
      {label}
    </label>
  );
}
