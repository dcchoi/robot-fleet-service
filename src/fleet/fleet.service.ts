import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Robot } from './entities/robot.entity';
import { RobotStatus } from './entities/robot-status.enum';
import { Coordinates } from './entities/coordinates.interface';
import { GRID_MAX, GRID_MIN } from './fleet.constants';
import { TelemetryEvent } from '../telemetry/entities/telemetry-event.entity';
import { TelemetryProducerService } from '../telemetry/telemetry-producer.service';

export interface CreateRobotInput {
  displayName: string;
  coordinates: Coordinates;
  status?: RobotStatus;
}

export interface ApplyTelemetryInput {
  robotId: string;
  status: RobotStatus;
  coordinates: Coordinates;
  returningHome: boolean;
  timestamp: string;
}

/**
 * Minimal shape needed for occupancy checks. Callers that already hold a
 * working set of positions (e.g. the simulator mid-tick) can pass plain
 * objects instead of full Robot entities.
 */
export type OccupancySnapshot = Array<Pick<Robot, 'robotId' | 'coordinates'>>;

@Injectable()
export class FleetService {
  private readonly logger = new Logger(FleetService.name);

  constructor(
    @InjectRepository(Robot)
    private readonly robotRepository: Repository<Robot>,
    @InjectRepository(TelemetryEvent)
    private readonly telemetryEventRepository: Repository<TelemetryEvent>,
    private readonly telemetryProducer: TelemetryProducerService,
  ) {}

  findAll(): Promise<Robot[]> {
    return this.robotRepository.find();
  }

  async findOneOrThrow(robotId: string): Promise<Robot> {
    const robot = await this.robotRepository.findOneBy({ robotId });
    if (!robot) {
      throw new NotFoundException(`Robot ${robotId} not found`);
    }
    return robot;
  }

  count(): Promise<number> {
    return this.robotRepository.count();
  }

  create(input: CreateRobotInput): Promise<Robot> {
    const robot = this.robotRepository.create({
      displayName: input.displayName,
      coordinates: input.coordinates,
      status: input.status ?? RobotStatus.RUNNING,
      lastCheckedAt: new Date(),
    });
    return this.robotRepository.save(robot);
  }

  /**
   * Commands never touch the `robots` table directly — they publish the
   * desired state as a telemetry event and let `applyTelemetry` (the single
   * writer, see below) apply it. This is what closes the race we used to
   * have between HTTP commands and simulator ticks both writing to Postgres:
   * now there's exactly one writer, fed by one ordered-per-robot Kafka log.
   * The trade-off is visible in the controller: a command can no longer
   * return the post-command Robot, only an acknowledgement that it was
   * published, since applying it happens asynchronously on the consumer.
   */
  async pause(robotId: string): Promise<void> {
    const robot = await this.findOneOrThrow(robotId);
    await this.publishCommand(robot, { status: RobotStatus.PAUSED });
  }

  async resume(robotId: string): Promise<void> {
    const robot = await this.findOneOrThrow(robotId);
    await this.publishCommand(robot, { status: RobotStatus.RUNNING });
  }

  /**
   * Starts the robot walking home. This only publishes the intent (and
   * un-pauses it if needed) — the simulator does the actual step-by-step
   * movement toward the origin on subsequent ticks and flips it to offline
   * on arrival, so the trip takes physical time rather than teleporting.
   */
  async returnHome(robotId: string): Promise<void> {
    const robot = await this.findOneOrThrow(robotId);
    await this.publishCommand(robot, {
      status: RobotStatus.RUNNING,
      returningHome: true,
    });
  }

  async checkHealth(robotId: string): Promise<void> {
    const robot = await this.findOneOrThrow(robotId);
    // No field changes intended — this is a pure heartbeat event that just
    // re-asserts current state with a fresh timestamp.
    await this.publishCommand(robot, {});
  }

  /**
   * Most recent telemetry history for a robot — the append-only event log
   * that `robots` is really just a point-in-time projection of. Exposing it
   * is the read side of CQRS: current state comes from `findOneOrThrow`,
   * history comes from here, and neither endpoint ever mutates anything.
   */
  getRecentEvents(robotId: string, limit = 50): Promise<TelemetryEvent[]> {
    return this.telemetryEventRepository.find({
      where: { robotId },
      order: { recordedAt: 'DESC' },
      take: limit,
    });
  }

  private async publishCommand(
    robot: Robot,
    changes: Partial<
      Pick<ApplyTelemetryInput, 'status' | 'returningHome'>
    >,
  ): Promise<void> {
    await this.telemetryProducer.publishTelemetry({
      robotId: robot.robotId,
      status: changes.status ?? robot.status,
      coordinates: robot.coordinates,
      returningHome: changes.returningHome ?? robot.returningHome,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * The single writer to the `robots` table — called only from the Kafka
   * consumer, for events from the simulator *and* from HTTP commands alike
   * (see `publishCommand` above). A direct update instead of find-then-save
   * keeps it to one round trip to Postgres on this hot path.
   *
   * The `lastCheckedAt < payload.timestamp` guard is an explicit,
   * data-layer-enforced consistency check: Kafka's per-key partitioning
   * (events are keyed by robotId) already guarantees this robot's events
   * are consumed in production order, so in the common case this condition
   * is always true. It's real defense, not decoration, against the case
   * that guarantee doesn't cover — e.g. a consumer rebalance or restart
   * that redelivers and reapplies an older message after a newer one has
   * already landed. Without it, that replay would silently roll the robot's
   * state backwards.
   */
  async applyTelemetry(payload: ApplyTelemetryInput): Promise<void> {
    const eventTimestamp = new Date(payload.timestamp);
    const result = await this.robotRepository.update(
      { robotId: payload.robotId, lastCheckedAt: LessThan(eventTimestamp) },
      {
        status: payload.status,
        coordinates: payload.coordinates,
        returningHome: payload.returningHome,
        lastCheckedAt: eventTimestamp,
      },
    );
    if (!result.affected) {
      const exists = await this.robotRepository.exists({
        where: { robotId: payload.robotId },
      });
      this.logger.warn(
        exists
          ? `Discarding stale/out-of-order telemetry for robot ${payload.robotId}`
          : `Discarding telemetry for unknown robot ${payload.robotId}`,
      );
    }
  }

  /**
   * True if any *other* robot currently occupies (x, y). Pass `snapshot` to
   * check against an already-fetched robot list instead of re-querying.
   */
  async isOccupied(
    x: number,
    y: number,
    excludeRobotId?: string,
    snapshot?: OccupancySnapshot,
  ): Promise<boolean> {
    const robots = snapshot ?? (await this.robotRepository.find());
    return this.buildOccupancySet(robots, excludeRobotId).has(
      this.cellKey(x, y),
    );
  }

  /**
   * Expanding-ring search outward from (targetX, targetY) for the nearest
   * unoccupied grid cell. `maxRadius` bounds the search (used by the
   * simulator so a crowded local area results in "stay in place" rather
   * than a long scan); omit it to search the whole grid (used by
   * return-home, which must always succeed at this fleet scale).
   */
  async findNearestFreeCell(
    targetX: number,
    targetY: number,
    excludeRobotId?: string,
    snapshot?: OccupancySnapshot,
    maxRadius: number = GRID_MAX - GRID_MIN,
  ): Promise<Coordinates | null> {
    const robots = snapshot ?? (await this.robotRepository.find());
    const occupied = this.buildOccupancySet(robots, excludeRobotId);
    const clampedX = this.clamp(targetX);
    const clampedY = this.clamp(targetY);

    for (let radius = 0; radius <= maxRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
          const x = clampedX + dx;
          const y = clampedY + dy;
          if (x < GRID_MIN || x > GRID_MAX || y < GRID_MIN || y > GRID_MAX) {
            continue;
          }
          if (!occupied.has(this.cellKey(x, y))) {
            return { x, y };
          }
        }
      }
    }
    return null;
  }

  private clamp(value: number): number {
    return Math.min(GRID_MAX, Math.max(GRID_MIN, Math.round(value)));
  }

  private cellKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  private buildOccupancySet(
    robots: OccupancySnapshot,
    excludeRobotId?: string,
  ): Set<string> {
    const set = new Set<string>();
    for (const robot of robots) {
      if (robot.robotId === excludeRobotId) continue;
      set.add(this.cellKey(robot.coordinates.x, robot.coordinates.y));
    }
    return set;
  }
}
