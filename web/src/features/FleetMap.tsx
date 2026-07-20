import type { Robot } from '../lib/types';
import { badgeStatus } from '../lib/format';

const GRID_MIN = -25;
const GRID_MAX = 25;
const GRID_SPAN = GRID_MAX - GRID_MIN;

const statusColorVar: Record<ReturnType<typeof badgeStatus>, string> = {
  online: 'var(--status-online)',
  paused: 'var(--status-paused)',
  offline: 'var(--status-offline)',
};

function toPercent(value: number): number {
  return ((value - GRID_MIN) / GRID_SPAN) * 100;
}

export interface FleetMapProps {
  robots: Robot[];
  onSelect: (robot: Robot) => void;
  selectedId: string | null;
}

export function FleetMap({ robots, onSelect, selectedId }: FleetMapProps) {
  const originLeft = toPercent(0);
  const originTop = 100 - toPercent(0);

  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        background: 'var(--bg-0)',
        backgroundImage:
          'linear-gradient(var(--border-0) 1px, transparent 1px),linear-gradient(90deg, var(--border-0) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        overflow: 'hidden',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        title="Home (0, 0)"
        style={{
          position: 'absolute',
          left: `${originLeft}%`,
          top: `${originTop}%`,
          width: 14,
          height: 14,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: '1px dashed var(--amber-400)',
        }}
      />
      {robots.map((r) => {
        const left = toPercent(r.coordinates.x);
        const top = 100 - toPercent(r.coordinates.y);
        const status = badgeStatus(r.status);
        const color = statusColorVar[status];
        const isSel = selectedId === r.robotId;
        return (
          <div
            key={r.robotId}
            onClick={() => onSelect(r)}
            title={`${r.displayName} — ${r.status} (${r.coordinates.x}, ${r.coordinates.y})`}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: `${top}%`,
              width: isSel ? 14 : 10,
              height: isSel ? 14 : 10,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: color,
              boxShadow: isSel ? `0 0 0 4px ${color}55` : status !== 'offline' ? `0 0 0 2px ${color}33` : 'none',
              cursor: 'pointer',
              transition: 'all var(--duration-fast) var(--ease-standard)',
            }}
          />
        );
      })}
      <div style={{ position: 'absolute', bottom: 10, left: 10, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', letterSpacing: '.05em' }}>
        GRID VIEW · x/y ∈ [-25, 25]
      </div>
    </div>
  );
}
