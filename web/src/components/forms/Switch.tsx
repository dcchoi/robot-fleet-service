import type { CSSProperties } from 'react';

export interface SwitchChangeEvent {
  target: { checked: boolean };
}

export interface SwitchProps {
  checked?: boolean;
  onChange?: (e: SwitchChangeEvent) => void;
  style?: CSSProperties;
}

export function Switch({ checked, onChange, style }: SwitchProps) {
  return (
    <button
      onClick={() => onChange?.({ target: { checked: !checked } })}
      style={{
        width: 36,
        height: 20,
        borderRadius: 'var(--radius-full)',
        border: '1px solid ' + (checked ? 'var(--accent-primary)' : 'var(--border-strong)'),
        background: checked ? 'var(--cyan-600)' : 'var(--bg-1)',
        position: 'relative',
        cursor: 'pointer',
        padding: 0,
        transition: 'background var(--duration-fast) var(--ease-standard)',
        ...style,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 1,
          left: checked ? 17 : 1,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: checked ? 'var(--accent-primary)' : 'var(--fg-2)',
          transition: 'left var(--duration-fast) var(--ease-standard)',
        }}
      />
    </button>
  );
}
