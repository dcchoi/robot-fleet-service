import { Test, TestingModule } from '@nestjs/testing';
import { FleetController } from './fleet.controller';
import { FleetService } from './fleet.service';
import { Robot } from './entities/robot.entity';
import { RobotStatus } from './entities/robot-status.enum';

type MockFleetService = Partial<Record<keyof FleetService, jest.Mock>>;

describe('FleetController', () => {
  let controller: FleetController;
  let service: MockFleetService;

  const robot: Robot = {
    robotId: 'robot-1',
    displayName: 'robot-1',
    lastCheckedAt: new Date(),
    status: RobotStatus.RUNNING,
    coordinates: { x: 0, y: 0 },
    returningHome: false,
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn().mockResolvedValue([robot]),
      findOneOrThrow: jest.fn().mockResolvedValue(robot),
      getRecentEvents: jest.fn().mockResolvedValue([]),
      pause: jest.fn().mockResolvedValue(undefined),
      resume: jest.fn().mockResolvedValue(undefined),
      returnHome: jest.fn().mockResolvedValue(undefined),
      checkHealth: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FleetController],
      providers: [{ provide: FleetService, useValue: service }],
    }).compile();

    controller = module.get(FleetController);
  });

  it('findAll delegates to the service', async () => {
    await expect(controller.findAll()).resolves.toEqual([robot]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('findOne delegates to the service with the given id', async () => {
    await expect(controller.findOne('robot-1')).resolves.toEqual(robot);
    expect(service.findOneOrThrow).toHaveBeenCalledWith('robot-1');
  });

  it('pause delegates to the service', async () => {
    await controller.pause('robot-1');

    expect(service.pause).toHaveBeenCalledWith('robot-1');
  });

  it('resume delegates to the service', async () => {
    await controller.resume('robot-1');

    expect(service.resume).toHaveBeenCalledWith('robot-1');
  });

  it('returnHome delegates to the service', async () => {
    await controller.returnHome('robot-1');

    expect(service.returnHome).toHaveBeenCalledWith('robot-1');
  });

  it('checkHealth delegates to the service', async () => {
    await controller.checkHealth('robot-1');

    expect(service.checkHealth).toHaveBeenCalledWith('robot-1');
  });
});
