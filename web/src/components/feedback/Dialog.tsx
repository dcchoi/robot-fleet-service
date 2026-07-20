import type { MouseEvent, ReactNode } from 'react';

export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  if (!open) return null;

  function stop(e: MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4,8,12,.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={stop}
        style={{
          width: 400,
          background: 'var(--surface-panel)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-default)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {title}
          <span onClick={onClose} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>
            ✕
          </span>
        </div>
        <div style={{ padding: 16, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {children}
        </div>
        {footer ? (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
