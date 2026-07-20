import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  TELEMETRY_KAFKA_CLIENT,
  TELEMETRY_TOPIC,
  TelemetryEventPayload,
} from './telemetry.constants';

@Injectable()
export class TelemetryProducerService implements OnModuleInit {
  constructor(
    @Inject(TELEMETRY_KAFKA_CLIENT) private readonly client: ClientKafka,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async publishTelemetry(payload: TelemetryEventPayload): Promise<void> {
    // Keying by robotId pins a given robot's events to one partition, so
    // raising the topic's partition count adds consumer parallelism across
    // robots without reordering events for any single robot.
    await firstValueFrom(
      this.client.emit(TELEMETRY_TOPIC, {
        key: payload.robotId,
        value: payload,
      }),
    );
  }
}
