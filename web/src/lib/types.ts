export const RobotStatus = {
  RUNNING: 'running',
  PAUSED: 'paused',
  OFFLINE: 'offline',
} as const;
export type RobotStatus = (typeof RobotStatus)[keyof typeof RobotStatus];

export interface Coordinates {
  x: number;
  y: number;
}

export interface Robot {
  robotId: string;
  displayName: string;
  status: RobotStatus;
  coordinates: Coordinates;
  returningHome: boolean;
  lastCheckedAt: string;
}

export interface TelemetryEvent {
  id: string;
  robotId: string;
  status: RobotStatus;
  coordinates: Coordinates;
  recordedAt: string;
  createdAt: string;
}

export type RobotCommand = 'pause' | 'resume' | 'return-home' | 'check-health';
