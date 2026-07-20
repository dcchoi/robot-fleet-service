# robot-fleet-service

A [NestJS](https://nestjs.com) service that manages a simulated robot fleet: it tracks robot position/status, ingests movement telemetry over Kafka, and runs a simulator that moves robots around a grid on a timer. A small built-in web dashboard lets you watch and command the fleet without hitting the API directly.

## Architecture

- **fleet** — REST API (`/robots`) and persistence for robots (Postgres via TypeORM).
- **telemetry** — Kafka producer/consumer that carries robot movement events and applies them to fleet state.
- **simulator** — seeds the fleet on boot and, on an interval, moves each robot and publishes telemetry for it.
- **public** — static web dashboard, served at `/` from the same origin as the API.

Fleet commands (pause/resume/return-home/check-health) don't write to Postgres directly — they publish a telemetry event and return `202 Accepted` immediately. The Kafka consumer is the single writer that applies every state change (from commands *and* simulator ticks) to the `robots` table, keyed and ordered per robot by `robotId`. This is what lets a command and a simulator tick for the same robot race safely instead of clobbering each other.

## Prerequisites

- Node.js
- Docker (for Postgres and Kafka)

## Project setup

```bash
npm install
cp .env.example .env
```

Start the backing services (Postgres on host port `15432`, Kafka on `9092`):

```bash
docker-compose up -d
```

## Run the service

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run build
npm run start:prod
```

On boot the service ensures the Kafka telemetry topic exists, connects to Postgres, and (if the `robots` table is empty) seeds `SIMULATOR_ROBOT_COUNT` robots that begin moving on each simulator tick.

Once it's running, open **http://localhost:3000** for the built-in dashboard, or use the API directly (below). For the fuller React dashboard, see [`web/`](web/README.md).

### Stopping / restarting

Stop the service with `Ctrl+C` in its terminal. To stop the backing services too (without deleting data):

```bash
docker-compose stop
```

To bring everything back up: `docker-compose up -d`, then `npm run start:dev` again. `docker-compose up -d` is safe to re-run against already-running containers; if it errors with a "container name already in use" conflict from stopped (not removed) containers, use `docker start fleet-postgres fleet-kafka` instead.

## Configuration

Environment variables (see `.env.example`):

| Variable                | Default     | Description                              |
| ------------------------ | ----------- | ----------------------------------------- |
| `PORT`                  | `3000`      | HTTP port                                 |
| `DB_HOST`               | `localhost` | Postgres host                             |
| `DB_PORT`               | `15432`     | Postgres port                             |
| `DB_USER`               | `fleet`     | Postgres user                             |
| `DB_PASSWORD`           | `fleet`     | Postgres password                         |
| `DB_NAME`               | `fleet`     | Postgres database                         |
| `KAFKA_BROKER`          | `localhost:9092` | Kafka broker address                 |
| `TELEMETRY_TOPIC_PARTITIONS` | `6`   | Partitions for the telemetry topic (raises consumer parallelism; events are keyed by robotId so per-robot order is preserved) |
| `SIMULATOR_ROBOT_COUNT` | `5`         | Robots to seed on first boot              |
| `SIMULATOR_TICK_MS`     | `3000`      | Milliseconds between simulator ticks      |

## API

| Method | Route                       | Description                       |
| ------ | ---------------------------- | ---------------------------------- |
| GET    | `/robots`                   | List all robots (current state)    |
| GET    | `/robots/:id`                | Get a single robot (current state) |
| GET    | `/robots/:id/events`          | Recent telemetry history for a robot, newest first |
| POST   | `/robots/:id/pause`          | Pause a running robot               |
| POST   | `/robots/:id/resume`         | Resume a paused robot, or redeploy an offline one back into the field |
| POST   | `/robots/:id/return-home`    | Send a robot walking back toward (0,0); it goes offline on arrival |
| POST   | `/robots/:id/check-health`   | Refresh a robot's last-checked time (no other state change) |

The four `POST` commands all return `202 Accepted` with no body — the state change happens asynchronously once the Kafka consumer applies the resulting event, not synchronously with the request. Poll `GET /robots/:id` (or watch the dashboard) to see it land.

## Run tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

Unit and e2e tests run against mocked repositories, so they don't require Postgres or Kafka to be running.
