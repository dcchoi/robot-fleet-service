import type { CSSProperties, ReactNode } from 'react';

export interface CardProps {
  children?: ReactNode;
  padded?: boolean;
  style?: CSSProperties;
}

export function Card({ children, padded = true, style }: CardProps) {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: padded ? 'var(--space-4)' : 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
