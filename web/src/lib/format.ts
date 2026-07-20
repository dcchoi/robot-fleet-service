import { RobotStatus } from './types';

// The design system's Badge/Tag/dot components speak in "online / paused /
// offline / idle / error" — the backend only ever reports running/paused/offline.
export type BadgeStatus = 'online' | 'paused' | 'offline';

export function badgeStatus(status: RobotStatus): BadgeStatus {
  if (status === RobotStatus.RUNNING) return 'online';
  if (status === RobotStatus.PAUSED) return 'paused';
  return 'offline';
}

export function relativeTime(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export function shortId(robotId: string): string {
  return robotId.slice(0, 8);
}
