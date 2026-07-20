import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { FleetService, OccupancySnapshot } from './fleet.service';
import { Robot } from './entities/robot.entity';
import { RobotStatus } from './entities/robot-status.enum';
import { TelemetryEvent } from '../telemetry/entities/telemetry-event.entity';
import { TelemetryProducerService } from '../telemetry/telemetry-producer.service';

type MockRepository = Partial<Record<keyof Repository<Robot>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  find: jest.fn(),
  findOneBy: jest.fn(),
  count: jest.fn(),
  create: jest.fn((input: Partial<Robot>) => input),
  save: jest.fn(),
  update: jest.fn(),
  exists: jest.fn(),
});

const createMockTelemetryProducer = (): Partial<
  Record<keyof TelemetryProducerService, jest.Mock>
> => ({
  publishTelemetry: jest.fn().mockResolvedValue(undefined),
});

function makeRobot(overrides: Partial<Robot> = {}): Robot {
  return {
    robotId: 'robot-1',
    displayName: 'robot-1',
    lastCheckedAt: new Date(),
    status: RobotStatus.RUNNING,
    coordinates: { x: 0, y: 0 },
    returningHome: false,
    ...overrides,
  };
}

describe('FleetService', () => {
  let service: FleetService;
  let repository: MockRepository;
  let telemetryProducer: Partial<
    Record<keyof TelemetryProducerService, jest.Mock>
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FleetService,
        {
          provide: getRepositoryToken(Robot),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(TelemetryEvent),
          useValue: createMockRepository(),
        },
        {
          provide: TelemetryProducerService,
          useValue: createMockTelemetryProducer(),
        },
      ],
    }).compile();

    service = module.get(FleetService);
    repository = module.get(getRepositoryToken(Robot));
    telemetryProducer = module.get(TelemetryProducerService);
  });

  describe('findOneOrThrow', () => {
    it('returns the robot when found', async () => {
      const robot = makeRobot();
      repository.findOneBy!.mockResolvedValue(robot);

      await expect(service.findOneOrThrow('robot-1')).resolves.toBe(robot);
    });

    it('throws NotFoundException when the robot does not exist', async () => {
      repository.findOneBy!.mockResolvedValue(null);

      await expect(service.findOneOrThrow('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('pause / resume / returnHome', () => {
    it('pause publishes a PAUSED command and does not write to Postgres', async () => {
      const robot = makeRobot({ status: RobotStatus.RUNNING });
      repository.findOneBy!.mockResolvedValue(robot);

      await service.pause('robot-1');

      expect(telemetryProducer.publishTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({
          robotId: 'robot-1',
          status: RobotStatus.PAUSED,
        }),
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('resume publishes a RUNNING command', async () => {
      const robot = makeRobot({ status: RobotStatus.PAUSED });
      repository.findOneBy!.mockResolvedValue(robot);

      await service.resume('robot-1');

      expect(telemetryProducer.publishTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({
          robotId: 'robot-1',
          status: RobotStatus.RUNNING,
        }),
      );
    });

    it('returnHome publishes a RUNNING + returningHome command', async () => {
      const robot = makeRobot({
        status: RobotStatus.PAUSED,
        returningHome: false,
      });
      repository.findOneBy!.mockResolvedValue(robot);

      await service.returnHome('robot-1');

      expect(telemetryProducer.publishTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({
          robotId: 'robot-1',
          status: RobotStatus.RUNNING,
          returningHome: true,
        }),
      );
    });
  });

  describe('applyTelemetry', () => {
    it('updates a known robot from the telemetry payload', async () => {
      repository.update!.mockResolvedValue({ affected: 1 });
      const eventTimestamp = new Date('2026-01-01T00:00:00.000Z');

      await service.applyTelemetry({
        robotId: 'robot-1',
        status: RobotStatus.PAUSED,
        coordinates: { x: 3, y: 4 },
        returningHome: true,
        timestamp: '2026-01-01T00:00:00.000Z',
      });

      expect(repository.update).toHaveBeenCalledWith(
        { robotId: 'robot-1', lastCheckedAt: LessThan(eventTimestamp) },
        {
          status: RobotStatus.PAUSED,
          coordinates: { x: 3, y: 4 },
          returningHome: true,
          lastCheckedAt: eventTimestamp,
        },
      );
      expect(repository.exists).not.toHaveBeenCalled();
    });

    it('discards telemetry for an unknown robot', async () => {
      repository.update!.mockResolvedValue({ affected: 0 });
      repository.exists!.mockResolvedValue(false);

      await service.applyTelemetry({
        robotId: 'ghost',
        status: RobotStatus.RUNNING,
        coordinates: { x: 0, y: 0 },
        returningHome: false,
        timestamp: '2026-01-01T00:00:00.000Z',
      });

      expect(repository.exists).toHaveBeenCalledWith({
        where: { robotId: 'ghost' },
      });
    });

    it('discards stale/out-of-order telemetry for a known robot', async () => {
      repository.update!.mockResolvedValue({ affected: 0 });
      repository.exists!.mockResolvedValue(true);

      await service.applyTelemetry({
        robotId: 'robot-1',
        status: RobotStatus.RUNNING,
        coordinates: { x: 0, y: 0 },
        returningHome: false,
        timestamp: '2026-01-01T00:00:00.000Z',
      });

      expect(repository.exists).toHaveBeenCalledWith({
        where: { robotId: 'robot-1' },
      });
    });
  });

  describe('isOccupied', () => {
    it('is true when another robot occupies the cell', async () => {
      const snapshot: OccupancySnapshot = [
        { robotId: 'a', coordinates: { x: 1, y: 1 } },
        { robotId: 'b', coordinates: { x: 2, y: 2 } },
      ];

      await expect(service.isOccupied(1, 1, undefined, snapshot)).resolves.toBe(
        true,
      );
    });

    it('ignores the excluded robot', async () => {
      const snapshot: OccupancySnapshot = [
        { robotId: 'a', coordinates: { x: 1, y: 1 } },
      ];

      await expect(service.isOccupied(1, 1, 'a', snapshot)).resolves.toBe(
        false,
      );
    });

    it('is false for an unoccupied cell', async () => {
      const snapshot: OccupancySnapshot = [
        { robotId: 'a', coordinates: { x: 1, y: 1 } },
      ];

      await expect(service.isOccupied(5, 5, undefined, snapshot)).resolves.toBe(
        false,
      );
    });
  });

  describe('findNearestFreeCell', () => {
    it('returns the target cell itself when it is free', async () => {
      const result = await service.findNearestFreeCell(0, 0, undefined, []);

      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('expands outward to the nearest free cell when the target is occupied', async () => {
      const snapshot: OccupancySnapshot = [
        { robotId: 'a', coordinates: { x: 0, y: 0 } },
      ];

      const result = await service.findNearestFreeCell(
        0,
        0,
        undefined,
        snapshot,
      );

      expect(result).not.toEqual({ x: 0, y: 0 });
      expect(Math.max(Math.abs(result!.x), Math.abs(result!.y))).toBe(1);
    });

    it('returns null when every cell within maxRadius is occupied', async () => {
      const snapshot: OccupancySnapshot = [
        { robotId: 'a', coordinates: { x: 0, y: 0 } },
      ];

      const result = await service.findNearestFreeCell(
        0,
        0,
        undefined,
        snapshot,
        0,
      );

      expect(result).toBeNull();
    });
  });
});
