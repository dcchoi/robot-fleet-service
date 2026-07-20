import { useEffect, useRef, useState } from 'react';
import { Badge } from './components/core/Badge';
import { Button } from './components/core/Button';
import { Input } from './components/forms/Input';
import { Select } from './components/forms/Select';
import { Card } from './components/data/Card';
import { Table } from './components/data/Table';
import { Toast } from './components/feedback/Toast';
import { Dialog } from './components/feedback/Dialog';
import { Sidebar } from './features/Sidebar';
import { FleetMap } from './features/FleetMap';
import { RobotDetailDrawer } from './features/RobotDetailDrawer';
import { listRobots, sendCommand } from './lib/api';
import { badgeStatus, relativeTime, shortId } from './lib/format';
import { RobotStatus, type Robot, type RobotCommand } from './lib/types';

const POLL_MS = 3000;

type StatusFilter = 'all' | RobotStatus;

interface ToastState {
  message: string;
  tone: 'success' | 'error';
}

function App() {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [connected, setConnected] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmHome, setConfirmHome] = useState<Robot | null>(null);
  const [pending, setPending] = useState<Record<string, RobotCommand | null>>({});

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const data = await listRobots();
        if (cancelled) return;
        setRobots(data);
        setConnected(true);
        setLoaded(true);
      } catch {
        if (!cancelled) setConnected(false);
      } finally {
        if (!cancelled) timer = setTimeout(poll, POLL_MS);
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(message: string, tone: ToastState['tone'] = 'success') {
    setToast({ message, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  async function runCommand(robot: Robot, command: RobotCommand) {
    if (command === 'return-home') {
      setConfirmHome(robot);
      return;
    }
    setPending((p) => ({ ...p, [robot.robotId]: command }));
    try {
      await sendCommand(robot.robotId, command);
      showToast(`POST /robots/${shortId(robot.robotId)}/${command} → 202 Accepted`);
    } catch (err) {
      showToast(`Command failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setPending((p) => ({ ...p, [robot.robotId]: null }));
    }
  }

  async function confirmReturnHome() {
    const robot = confirmHome;
    setConfirmHome(null);
    if (!robot) return;
    setPending((p) => ({ ...p, [robot.robotId]: 'return-home' }));
    try {
      await sendCommand(robot.robotId, 'return-home');
      showToast(`POST /robots/${shortId(robot.robotId)}/return-home → 202 Accepted`);
    } catch (err) {
      showToast(`Command failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setPending((p) => ({ ...p, [robot.robotId]: null }));
    }
  }

  const filtered = robots.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (query && !r.displayName.toLowerCase().includes(query.toLowerCase()) && !r.robotId.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }
    return true;
  });

  const selected = robots.find((r) => r.robotId === selectedId) ?? null;

  return (
    <div style={{ position: 'relative', display: 'flex', height: '100vh', width: '100%', background: 'var(--bg-0)', overflow: 'hidden', fontFamily: 'var(--font-mono)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div
          style={{
            height: 'var(--header-h)',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 'var(--text-md)' }}>Fleet Overview</span>
            <Badge status={connected ? 'online' : 'error'}>{connected ? 'live' : 'reconnecting…'}</Badge>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input placeholder="Search robot…" value={query} onChange={(e) => setQuery(e.target.value)} size="sm" style={{ width: 200 }} />
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value as StatusFilter)}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: RobotStatus.RUNNING, label: 'Running' },
                { value: RobotStatus.PAUSED, label: 'Paused' },
                { value: RobotStatus.OFFLINE, label: 'Offline' },
              ]}
            />
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', minHeight: 0, padding: 16, gap: 16 }}>
          <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[RobotStatus.RUNNING, RobotStatus.PAUSED, RobotStatus.OFFLINE].map((st) => {
              const count = robots.filter((r) => r.status === st).length;
              return (
                <div key={st} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    {st}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{count}</div>
                </div>
              );
            })}
            <Card padded={false} style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              {!loaded ? (
                <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Loading fleet…</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No robots match.</div>
              ) : (
                <Table
                  rowKey="robotId"
                  selectedRowKey={selectedId}
                  onRowClick={(r) => setSelectedId(r.robotId)}
                  columns={[
                    {
                      key: 'displayName',
                      label: 'Robot',
                      render: (r: Robot) => (
                        <>
                          <div style={{ color: 'var(--text-primary)' }}>{r.displayName}</div>
                          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{shortId(r.robotId)}</div>
                        </>
                      ),
                    },
                    { key: 'status', label: 'Status', render: (r: Robot) => <Badge status={badgeStatus(r.status)} /> },
                    { key: 'lastCheckedAt', label: 'Last seen', render: (r: Robot) => relativeTime(r.lastCheckedAt) },
                  ]}
                  rows={filtered}
                />
              )}
            </Card>
          </div>
          <FleetMap robots={filtered} onSelect={(r) => setSelectedId(r.robotId)} selectedId={selectedId} />
        </div>
      </div>

      <RobotDetailDrawer robot={selected} onClose={() => setSelectedId(null)} onCommand={runCommand} pendingCommand={selected ? pending[selected.robotId] ?? null : null} />

      {toast && (
        <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 200 }}>
          <Toast tone={toast.tone === 'success' ? 'success' : 'error'} onClose={() => setToast(null)}>
            {toast.message}
          </Toast>
        </div>
      )}

      <Dialog
        open={!!confirmHome}
        onClose={() => setConfirmHome(null)}
        title="Return robot home?"
        footer={
          <>
            <Button size="sm" variant="ghost" onClick={() => setConfirmHome(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={confirmReturnHome}>
              Confirm
            </Button>
          </>
        }
      >
        {confirmHome ? `${confirmHome.displayName} will walk back to (0, 0) at its normal step interval.` : ''}
      </Dialog>
    </div>
  );
}

export default App;
