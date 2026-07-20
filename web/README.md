# Fleet — dashboard frontend

Vite + React + TypeScript UI for the `robot-fleet-service` NestJS backend. Visual language ported from the Fleet design system (dark/industrial, JetBrains Mono, cyan accent) into real TSX components under `src/components/`.

## Run

The backend must already be running (Postgres + Kafka via `docker-compose up`, then `npm run start:dev` from the repo root) and listening on `:3000`.

```bash
npm install
npm run dev
```

Requests to `/robots` are proxied to `http://localhost:3000` in dev (see `vite.config.ts`) — no CORS setup needed on the backend.

Stop it with `Ctrl+C` in its terminal. Restart the same way (`npm run dev`).

## Structure

- `src/components/{core,forms,feedback,navigation,data}/` — ported design-system primitives (Button, Badge, Input, Select, Checkbox, Switch, Card, Table, Tabs, Dialog, Toast, Tooltip, ProgressBar, IconButton, Tag)
- `src/features/` — dashboard layout: `Sidebar`, `FleetMap`, `RobotDetailDrawer`
- `src/lib/` — `types.ts` (mirrors the backend entities), `api.ts` (fetch client), `format.ts` (status/time helpers)
- `src/App.tsx` — dashboard page: polls `GET /robots` every 3s (matches `SIMULATOR_TICK_MS`), search/status filter, status tiles, robot table, grid map, detail drawer with Pause/Resume/Return Home/Check Health

Commands (`pause`/`resume`/`return-home`/`check-health`) are fire-and-forget: the backend returns `202 Accepted` immediately and applies the change asynchronously via Kafka, so the UI shows a toast on send and relies on the next poll to reflect the new state.
