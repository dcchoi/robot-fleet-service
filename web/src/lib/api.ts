import type { Robot, RobotCommand, TelemetryEvent } from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} -> ${response.status}`);
  }
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export function listRobots(): Promise<Robot[]> {
  return request<Robot[]>('/robots');
}

export function getRobot(robotId: string): Promise<Robot> {
  return request<Robot>(`/robots/${robotId}`);
}

export function getRobotEvents(robotId: string): Promise<TelemetryEvent[]> {
  return request<TelemetryEvent[]>(`/robots/${robotId}/events`);
}

export function sendCommand(robotId: string, command: RobotCommand): Promise<void> {
  return request<void>(`/robots/${robotId}/${command}`, { method: 'POST' });
}
