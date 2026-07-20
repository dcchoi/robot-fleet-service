import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelemetryEvent } from './entities/telemetry-event.entity';
import { FleetService } from '../fleet/fleet.service';
import { TELEMETRY_TOPIC, TelemetryEventPayload } from './telemetry.constants';

@Controller()
export class TelemetryConsumerController {
  constructor(
    @InjectRepository(TelemetryEvent)
    private readonly telemetryRepository: Repository<TelemetryEvent>,
    private readonly fleetService: FleetService,
  ) {}

  @EventPattern(TELEMETRY_TOPIC)
  async handleTelemetry(
    @Payload() payload: TelemetryEventPayload,
  ): Promise<void> {
    const event = this.telemetryRepository.create({
      robotId: payload.robotId,
      status: payload.status,
      coordinates: payload.coordinates,
      recordedAt: new Date(payload.timestamp),
    });
    await this.telemetryRepository.save(event);
    await this.fleetService.applyTelemetry(payload);
  }
}
