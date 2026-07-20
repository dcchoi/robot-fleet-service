import { useState, type ChangeEvent, type CSSProperties, type InputHTMLAttributes } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'style' | 'size' | 'onChange'> {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  size?: 'sm' | 'md';
  style?: CSSProperties;
}

export function Input({ placeholder, value, onChange, size = 'md', style, ...rest }: InputProps) {
  const [focus, setFocus] = useState(false);
  const h = size === 'sm' ? 28 : 34;

  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        height: h,
        padding: '0 10px',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        background: 'var(--bg-1)',
        color: 'var(--text-primary)',
        border: '1px solid ' + (focus ? 'var(--accent-primary)' : 'var(--border-default)'),
        borderRadius: 'var(--radius-md)',
        outline: 'none',
        boxShadow: focus ? 'var(--shadow-glow-cyan)' : 'none',
        transition: 'box-shadow var(--duration-fast) var(--ease-standard)',
        ...style,
      }}
      {...rest}
    />
  );
}
