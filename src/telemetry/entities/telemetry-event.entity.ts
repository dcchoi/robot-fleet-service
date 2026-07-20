import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Robot } from '../../fleet/entities/robot.entity';
import { RobotStatus } from '../../fleet/entities/robot-status.enum';
import { Coordinates } from '../../fleet/entities/coordinates.interface';

@Entity('telemetry_events')
export class TelemetryEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Robot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'robotId' })
  robot: Robot;

  @Column('uuid')
  robotId: string;

  @Column({ type: 'enum', enum: RobotStatus })
  status: RobotStatus;

  @Column('jsonb')
  coordinates: Coordinates;

  @Column({ type: 'timestamptz' })
  recordedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
