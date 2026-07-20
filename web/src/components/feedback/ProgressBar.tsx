import type { CSSProperties } from 'react';

export type ProgressBarTone = 'cyan' | 'green' | 'amber' | 'red';

export interface ProgressBarProps {
  value?: number;
  tone?: ProgressBarTone;
  style?: CSSProperties;
}

const colors: Record<ProgressBarTone, string> = {
  cyan: 'var(--cyan-400)',
  green: 'var(--green-400)',
  amber: 'var(--amber-400)',
  red: 'var(--red-400)',
};

export function ProgressBar({ value = 0, tone = 'cyan', style }: ProgressBarProps) {
  return (
    <div style={{ height: 6, background: 'var(--bg-3)', borderRadius: 'var(--radius-full)', overflow: 'hidden', ...style }}>
      <div
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          height: '100%',
          background: colors[tone] ?? colors.cyan,
          transition: 'width var(--duration-normal) var(--ease-standard)',
        }}
      />
    </div>
  );
}
