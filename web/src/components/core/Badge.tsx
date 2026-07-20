import type { CSSProperties, ReactNode } from 'react';

export type BadgeStatus = 'online' | 'paused' | 'offline' | 'idle' | 'error';

export interface BadgeProps {
  status?: BadgeStatus;
  children?: ReactNode;
  style?: CSSProperties;
}

const statusColor: Record<BadgeStatus, string> = {
  online: 'var(--status-online)',
  paused: 'var(--status-paused)',
  offline: 'var(--status-offline)',
  idle: 'var(--status-idle)',
  error: 'var(--status-error)',
};

export function Badge({ status = 'idle', children, style }: BadgeProps) {
  const c = statusColor[status] ?? statusColor.idle;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-2xs)',
        fontWeight: 600,
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        ...style,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: c,
          boxShadow: status !== 'idle' ? `0 0 0 3px ${c}33` : 'none',
          flexShrink: 0,
        }}
      />
      {children ?? status}
    </span>
  );
}
