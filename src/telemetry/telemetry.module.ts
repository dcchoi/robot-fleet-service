import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelemetryEvent } from './entities/telemetry-event.entity';
import { TelemetryConsumerController } from './telemetry-consumer.controller';
import { TelemetryProducerModule } from './telemetry-producer.module';
import { FleetModule } from '../fleet/fleet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TelemetryEvent]),
    FleetModule,
    TelemetryProducerModule,
  ],
  controllers: [TelemetryConsumerController],
  exports: [TelemetryProducerModule],
})
export class TelemetryModule {}
