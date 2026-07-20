import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { FleetService } from '../fleet/fleet.service';
import { RobotStatus } from '../fleet/entities/robot-status.enum';
import { Robot } from '../fleet/entities/robot.entity';
import { Coordinates } from '../fleet/entities/coordinates.interface';
import { GRID_MAX, GRID_MIN } from '../fleet/fleet.constants';
import { TelemetryProducerService } from '../telemetry/telemetry-producer.service';
import { TelemetryEventPayload } from '../telemetry/telemetry.constants';
import {
  ARRIVAL_RADIUS,
  BLOCKED_SEARCH_RADIUS,
  MOVE_DELTA,
  SIMULATOR_TICK_INTERVAL_NAME,
} from './simulator.constants';

@Injectable()
export class SimulatorService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SimulatorService.name);
  private readonly robotCount: number;
  private readonly tickMs: number;

  constructor(
    private readonly fleetService: FleetService,
    private readonly telemetryProducer: TelemetryProducerService,
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.robotCount = Number(this.config.get('SIMULATOR_ROBOT_COUNT') ?? 5);
    this.tickMs = Number(this.config.get('SIMULATOR_TICK_MS') ?? 3000);
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.seedFleet();
    const interval = setInterval(() => {
      this.tick().catch((error) => this.logger.error('Tick failed', error));
    }, this.tickMs);
    this.schedulerRegistry.addInterval(SIMULATOR_TICK_INTERVAL_NAME, interval);
  }

  private async seedFleet(): Promise<void> {
    const existing = await this.fleetService.count();
    if (existing > 0) {
      this.logger.log(`Fleet already seeded with ${existing} robots`);
      return;
    }
    for (let i = 1; i <= this.robotCount; i++) {
      const target: Coordinates = {
        x: this.randomInt(GRID_MIN, GRID_MAX),
        y: this.randomInt(GRID_MIN, GRID_MAX),
      };
      const cell =
        (await this.fleetService.findNearestFreeCell(target.x, target.y)) ??
        target;
      await this.fleetService.create({
        displayName: `robot-${i}`,
        coordinates: cell,
      });
    }
    this.logger.log(`Seeded ${this.robotCount} robots`);
  }

  private async tick(): Promise<void> {
    const robots = await this.fleetService.findAll();
    // Tracks each robot's position as it's decided this tick, so two robots
    // processed in the same tick never both claim the same free cell.
    const positions = new Map<string, Coordinates>(
      robots.map((robot) => [robot.robotId, robot.coordinates]),
    );

    const payloads: TelemetryEventPayload[] = [];

    for (const robot of robots) {
      if (robot.status === RobotStatus.OFFLINE) continue;

      let nextCoordinates = positions.get(robot.robotId)!;
      let nextStatus: RobotStatus = robot.status;
      let nextReturningHome = robot.returningHome;

      if (robot.status === RobotStatus.RUNNING) {
        if (robot.returningHome) {
          const result = await this.stepTowardHome(
            robot,
            nextCoordinates,
            positions,
          );
          nextCoordinates = result.coordinates;
          if (result.arrived) {
            nextStatus = RobotStatus.OFFLINE;
            nextReturningHome = false;
          }
        } else {
          nextCoordinates = await this.computeNextPosition(
            robot,
            nextCoordinates,
            positions,
          );
        }
        positions.set(robot.robotId, nextCoordinates);
      }

      payloads.push({
        robotId: robot.robotId,
        status: nextStatus,
        coordinates: nextCoordinates,
        returningHome: nextReturningHome,
        timestamp: new Date().toISOString(),
      });
    }

    // Position resolution above must stay sequential — each robot's
    // occupancy check depends on the positions already claimed earlier in
    // this same tick. Publishing has no such dependency, so it's fanned out
    // instead of awaited one robot at a time; otherwise tick latency grows
    // linearly with fleet size.
    await Promise.all(
      payloads.map((payload) =>
        this.telemetryProducer.publishTelemetry(payload),
      ),
    );
  }

  private async computeNextPosition(
    robot: Robot,
    current: Coordinates,
    positions: Map<string, Coordinates>,
  ): Promise<Coordinates> {
    const candidate: Coordinates = {
      x: this.clamp(current.x + this.randomDelta()),
      y: this.clamp(current.y + this.randomDelta()),
    };
    return this.resolveCandidate(candidate, robot.robotId, current, positions);
  }

  private async stepTowardHome(
    robot: Robot,
    current: Coordinates,
    positions: Map<string, Coordinates>,
  ): Promise<{ coordinates: Coordinates; arrived: boolean }> {
    const candidate: Coordinates = {
      x: current.x + this.stepToward(current.x, 0),
      y: current.y + this.stepToward(current.y, 0),
    };
    const coordinates = await this.resolveCandidate(
      candidate,
      robot.robotId,
      current,
      positions,
    );
    const arrived =
      Math.max(Math.abs(coordinates.x), Math.abs(coordinates.y)) <=
      ARRIVAL_RADIUS;
    return { coordinates, arrived };
  }

  /**
   * Shared collision handling for any computed candidate move: take it if
   * free, otherwise settle for the nearest free cell nearby, otherwise stay
   * put this tick (like a real robot waiting for a clear path).
   */
  private async resolveCandidate(
    candidate: Coordinates,
    robotId: string,
    current: Coordinates,
    positions: Map<string, Coordinates>,
  ): Promise<Coordinates> {
    const snapshot = Array.from(positions, ([id, coordinates]) => ({
      robotId: id,
      coordinates,
    }));

    const occupied = await this.fleetService.isOccupied(
      candidate.x,
      candidate.y,
      robotId,
      snapshot,
    );
    if (!occupied) return candidate;

    const nearest = await this.fleetService.findNearestFreeCell(
      candidate.x,
      candidate.y,
      robotId,
      snapshot,
      BLOCKED_SEARCH_RADIUS,
    );
    return nearest ?? current;
  }

  private stepToward(value: number, target: number): number {
    const delta = target - value;
    if (delta === 0) return 0;
    const magnitude = Math.min(MOVE_DELTA, Math.abs(delta));
    return delta > 0 ? magnitude : -magnitude;
  }

  private randomDelta(): number {
    return this.randomInt(-MOVE_DELTA, MOVE_DELTA);
  }

  private clamp(value: number): number {
    return Math.min(GRID_MAX, Math.max(GRID_MIN, value));
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
