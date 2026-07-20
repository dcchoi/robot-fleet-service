import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { FleetModule } from './fleet/fleet.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { SimulatorModule } from './simulator/simulator.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    FleetModule,
    TelemetryModule,
    SimulatorModule,
  ],
})
export class AppModule {}
