import { useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'size'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: CSSProperties;
}

const sizeMap: Record<ButtonSize, { h: number; px: number; fs: string }> = {
  sm: { h: 28, px: 10, fs: 'var(--text-xs)' },
  md: { h: 34, px: 14, fs: 'var(--text-sm)' },
  lg: { h: 40, px: 18, fs: 'var(--text-base)' },
};

const variantMap: Record<ButtonVariant, { bg: string; fg: string; border: string; hoverBg: string }> = {
  primary: { bg: 'var(--accent-primary)', fg: 'var(--accent-primary-fg)', border: 'var(--accent-primary)', hoverBg: 'var(--cyan-500)' },
  secondary: { bg: 'var(--surface-raised)', fg: 'var(--text-primary)', border: 'var(--border-strong)', hoverBg: 'var(--surface-hover)' },
  ghost: { bg: 'transparent', fg: 'var(--text-secondary)', border: 'transparent', hoverBg: 'var(--surface-hover)' },
  danger: { bg: 'transparent', fg: 'var(--status-offline)', border: 'var(--status-offline)', hoverBg: 'rgba(248,113,113,.12)' },
};

export function Button({ children, variant = 'primary', size = 'md', disabled = false, onClick, style, ...rest }: ButtonProps) {
  const s = sizeMap[size] ?? sizeMap.md;
  const v = variantMap[variant] ?? variantMap.primary;
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: s.h,
        padding: `0 ${s.px}px`,
        fontSize: s.fs,
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        background: hover && !disabled ? v.hoverBg : v.bg,
        color: v.fg,
        border: `1px solid ${v.border}`,
        borderRadius: 'var(--radius-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'background var(--duration-fast) var(--ease-standard)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
