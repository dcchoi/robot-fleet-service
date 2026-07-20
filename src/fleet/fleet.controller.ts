import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { FleetService } from './fleet.service';
import { Robot } from './entities/robot.entity';
import { TelemetryEvent } from '../telemetry/entities/telemetry-event.entity';

@Controller('robots')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get()
  findAll(): Promise<Robot[]> {
    return this.fleetService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Robot> {
    return this.fleetService.findOneOrThrow(id);
  }

  @Get(':id/events')
  getRecentEvents(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TelemetryEvent[]> {
    return this.fleetService.getRecentEvents(id);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.ACCEPTED)
  pause(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.fleetService.pause(id);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.ACCEPTED)
  resume(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.fleetService.resume(id);
  }

  @Post(':id/return-home')
  @HttpCode(HttpStatus.ACCEPTED)
  returnHome(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.fleetService.returnHome(id);
  }

  @Post(':id/check-health')
  @HttpCode(HttpStatus.ACCEPTED)
  checkHealth(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.fleetService.checkHealth(id);
  }
}
