import type { CSSProperties, ReactNode } from 'react';

export type TagTone = 'neutral' | 'cyan' | 'green' | 'amber' | 'red';

export interface TagProps {
  children: ReactNode;
  tone?: TagTone;
  style?: CSSProperties;
}

const tones: Record<TagTone, { bg: string; fg: string; bd: string }> = {
  neutral: { bg: 'var(--surface-raised)', fg: 'var(--text-secondary)', bd: 'var(--border-default)' },
  cyan: { bg: 'rgba(34,211,238,.1)', fg: 'var(--cyan-400)', bd: 'var(--cyan-600)' },
  green: { bg: 'rgba(74,222,128,.1)', fg: 'var(--green-400)', bd: 'var(--green-500)' },
  amber: { bg: 'rgba(251,191,36,.1)', fg: 'var(--amber-400)', bd: 'var(--amber-500)' },
  red: { bg: 'rgba(248,113,113,.1)', fg: 'var(--red-400)', bd: 'var(--red-500)' },
};

export function Tag({ children, tone = 'neutral', style }: TagProps) {
  const t = tones[tone] ?? tones.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 20,
        padding: '0 8px',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-2xs)',
        fontWeight: 600,
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        borderRadius: 'var(--radius-sm)',
        ...style,
      }}
    >
      {children}
    </span>
  );
}
