import { Module } from '@nestjs/common';
import { FleetModule } from '../fleet/fleet.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { SimulatorService } from './simulator.service';

@Module({
  imports: [FleetModule, TelemetryModule],
  providers: [SimulatorService],
})
export class SimulatorModule {}
