import { useState, type ReactNode } from 'react';

export interface TooltipProps {
  label: ReactNode;
  children: ReactNode;
}

export function Tooltip({ label, children }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show ? (
        <span
          style={{
            position: 'absolute',
            bottom: '120%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 8px',
            background: 'var(--bg-4)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-2xs)',
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 50,
          }}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
