import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Robot } from './entities/robot.entity';
import { FleetService } from './fleet.service';
import { FleetController } from './fleet.controller';
import { TelemetryEvent } from '../telemetry/entities/telemetry-event.entity';
import { TelemetryProducerModule } from '../telemetry/telemetry-producer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Robot, TelemetryEvent]),
    TelemetryProducerModule,
  ],
  controllers: [FleetController],
  providers: [FleetService],
  exports: [FleetService],
})
export class FleetModule {}
