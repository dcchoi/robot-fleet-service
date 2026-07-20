import type { CSSProperties, ReactNode } from 'react';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  tone?: ToastTone;
  children?: ReactNode;
  onClose?: () => void;
  style?: CSSProperties;
}

const toneColor: Record<ToastTone, string> = {
  info: 'var(--cyan-400)',
  success: 'var(--green-400)',
  warning: 'var(--amber-400)',
  error: 'var(--red-400)',
};

export function Toast({ tone = 'info', children, onClose, style }: ToastProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: 'var(--surface-raised)',
        border: '1px solid var(--border-strong)',
        borderLeft: `3px solid ${toneColor[tone] ?? toneColor.info}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-primary)',
        minWidth: 260,
        ...style,
      }}
    >
      <span style={{ flex: 1 }}>{children}</span>
      {onClose ? (
        <span onClick={onClose} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>
          ✕
        </span>
      ) : null}
    </div>
  );
}
