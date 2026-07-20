import { useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'size'> {
  children: ReactNode;
  active?: boolean;
  size?: number;
  style?: CSSProperties;
}

export function IconButton({ children, active = false, onClick, size = 32, style, ...rest }: IconButtonProps) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? 'var(--surface-hover)' : hover ? 'var(--surface-raised)' : 'transparent',
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        border: '1px solid ' + (active ? 'var(--border-strong)' : 'transparent'),
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'background var(--duration-fast) var(--ease-standard)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
