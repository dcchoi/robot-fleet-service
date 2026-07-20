import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FleetModule } from '../src/fleet/fleet.module';
import { Robot } from '../src/fleet/entities/robot.entity';
import { RobotStatus } from '../src/fleet/entities/robot-status.enum';

describe('Fleet (e2e)', () => {
  let app: INestApplication<App>;

  const robot: Robot = {
    robotId: '11111111-1111-4111-8111-111111111111',
    displayName: 'robot-1',
    lastCheckedAt: new Date(),
    status: RobotStatus.RUNNING,
    coordinates: { x: 0, y: 0 },
    returningHome: false,
  };

  const repository = {
    find: jest.fn().mockResolvedValue([robot]),
    findOneBy: jest
      .fn()
      .mockImplementation(({ robotId }: { robotId: string }) =>
        Promise.resolve(robotId === robot.robotId ? robot : null),
      ),
    save: jest.fn().mockImplementation((r: Robot) => Promise.resolve(r)),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [FleetModule],
    })
      .overrideProvider(getRepositoryToken(Robot))
      .useValue(repository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /robots returns the fleet', async () => {
    const response = await request(app.getHttpServer())
      .get('/robots')
      .expect(200);

    const body = response.body as Robot[];
    expect(body).toHaveLength(1);
    expect(body[0].robotId).toBe(robot.robotId);
  });

  it('GET /robots/:id returns a single robot', async () => {
    await request(app.getHttpServer())
      .get(`/robots/${robot.robotId}`)
      .expect(200)
      .expect((res) => {
        expect((res.body as Robot).robotId).toBe(robot.robotId);
      });
  });

  it('GET /robots/:id returns 404 for an unknown robot', async () => {
    await request(app.getHttpServer())
      .get('/robots/22222222-2222-4222-8222-222222222222')
      .expect(404);
  });

  it('GET /robots/:id returns 400 for a non-UUID id', async () => {
    await request(app.getHttpServer()).get('/robots/not-a-uuid').expect(400);
  });

  it('POST /robots/:id/pause pauses the robot', async () => {
    await request(app.getHttpServer())
      .post(`/robots/${robot.robotId}/pause`)
      .expect(201)
      .expect((res) => {
        expect((res.body as Robot).status).toBe(RobotStatus.PAUSED);
      });
  });
});
