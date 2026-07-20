import { useEffect, useState } from 'react';
import { Badge } from '../components/core/Badge';
import { Button } from '../components/core/Button';
import { Tag } from '../components/core/Tag';
import { Tabs } from '../components/navigation/Tabs';
import { Table } from '../components/data/Table';
import { getRobotEvents } from '../lib/api';
import { badgeStatus, relativeTime, shortId } from '../lib/format';
import { RobotStatus, type Robot, type RobotCommand, type TelemetryEvent } from '../lib/types';

export interface RobotDetailDrawerProps {
  robot: Robot | null;
  onClose: () => void;
  onCommand: (robot: Robot, command: RobotCommand) => void;
  pendingCommand?: RobotCommand | null;
}

type Tab = 'overview' | 'logs';

export function RobotDetailDrawer({ robot, onClose, onCommand, pendingCommand = null }: RobotDetailDrawerProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    setTab('overview');
  }, [robot?.robotId]);

  useEffect(() => {
    if (!robot || tab !== 'logs') return;
    let cancelled = false;
    setEventsLoading(true);
    getRobotEvents(robot.robotId)
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [robot, tab]);

  if (!robot) return null;

  const isRunning = robot.status === RobotStatus.RUNNING;
  const isOffline = robot.status === RobotStatus.OFFLINE;
  const busy = pendingCommand;

  return (
    <div
      style={{
        width: 340,
        background: 'var(--surface-panel)',
        borderLeft: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%',
      }}
    >
      <div style={{ padding: 16, borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{robot.displayName}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', marginTop: 2 }}>
            {shortId(robot.robotId)}
          </div>
          <div style={{ marginTop: 6 }}>
            <Badge status={badgeStatus(robot.status)} />
          </div>
        </div>
        <span onClick={onClose} style={{ cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          ✕
        </span>
      </div>

      <Tabs
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'logs', label: 'Logs' },
        ]}
        active={tab}
        onChange={(v) => setTab(v as Tab)}
      />

      {tab === 'overview' ? (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <div style={{ color: 'var(--text-muted)' }}>Status</div>
            <div style={{ color: 'var(--text-primary)' }}>{robot.status}</div>
            <div style={{ color: 'var(--text-muted)' }}>Position</div>
            <div style={{ color: 'var(--text-primary)' }}>
              x:{robot.coordinates.x} y:{robot.coordinates.y}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>Returning home</div>
            <div style={{ color: 'var(--text-primary)' }}>{robot.returningHome ? 'yes' : 'no'}</div>
            <div style={{ color: 'var(--text-muted)' }}>Last checked</div>
            <div style={{ color: 'var(--text-primary)' }}>{relativeTime(robot.lastCheckedAt)}</div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tag tone={isRunning ? 'green' : isOffline ? 'red' : 'amber'}>{robot.status}</Tag>
            {robot.returningHome ? <Tag tone="cyan">returning home</Tag> : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <Button
              size="sm"
              variant={isRunning ? 'secondary' : 'primary'}
              disabled={busy === 'pause' || busy === 'resume'}
              onClick={() => onCommand(robot, isRunning ? 'pause' : 'resume')}
            >
              {busy === 'pause' || busy === 'resume' ? 'Sending…' : isRunning ? 'Pause' : isOffline ? 'Redeploy' : 'Resume'}
            </Button>
            <Button size="sm" variant="secondary" disabled={isOffline || busy === 'return-home'} onClick={() => onCommand(robot, 'return-home')}>
              {busy === 'return-home' ? 'Sending…' : 'Return Home'}
            </Button>
            <Button size="sm" variant="ghost" disabled={busy === 'check-health'} onClick={() => onCommand(robot, 'check-health')}>
              {busy === 'check-health' ? 'Sending…' : 'Check Health'}
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ padding: 16, overflow: 'auto', flex: 1 }}>
          {eventsLoading ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Loading…</div>
          ) : events.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>No recorded events yet.</div>
          ) : (
            <Table
              rowKey="id"
              columns={[
                { key: 'recordedAt', label: 'When', render: (e: TelemetryEvent) => relativeTime(e.recordedAt) },
                { key: 'status', label: 'Status' },
                { key: 'coordinates', label: 'Position', render: (e: TelemetryEvent) => `x:${e.coordinates.x} y:${e.coordinates.y}` },
              ]}
              rows={events}
            />
          )}
        </div>
      )}
    </div>
  );
}
