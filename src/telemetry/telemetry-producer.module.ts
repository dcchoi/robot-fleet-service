import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TelemetryProducerService } from './telemetry-producer.service';
import { TELEMETRY_KAFKA_CLIENT } from './telemetry.constants';

// Split out from TelemetryModule (which also hosts the consumer and depends
// on FleetModule) so FleetModule can import just the producer to publish
// commands without creating a FleetModule <-> TelemetryModule import cycle.
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: TELEMETRY_KAFKA_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: [config.get<string>('KAFKA_BROKER') ?? 'localhost:9092'],
            },
            producerOnlyMode: true,
          },
        }),
      },
    ]),
  ],
  providers: [TelemetryProducerService],
  exports: [TelemetryProducerService],
})
export class TelemetryProducerModule {}
