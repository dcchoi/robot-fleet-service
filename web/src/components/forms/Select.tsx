import { useState, type ChangeEvent, type CSSProperties } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  options?: SelectOption[];
  style?: CSSProperties;
}

export function Select({ value, onChange, options = [], style }: SelectProps) {
  const [focus, setFocus] = useState(false);

  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        height: 34,
        padding: '0 8px',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        background: 'var(--bg-1)',
        color: 'var(--text-primary)',
        border: '1px solid ' + (focus ? 'var(--accent-primary)' : 'var(--border-default)'),
        borderRadius: 'var(--radius-md)',
        outline: 'none',
        cursor: 'pointer',
        ...style,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
