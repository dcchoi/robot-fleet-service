import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { RobotStatus } from './robot-status.enum';
import { Coordinates } from './coordinates.interface';

@Entity('robots')
export class Robot {
  @PrimaryGeneratedColumn('uuid')
  robotId: string;

  @Column()
  displayName: string;

  @Column({ type: 'timestamptz' })
  lastCheckedAt: Date;

  @Column({ type: 'enum', enum: RobotStatus, default: RobotStatus.RUNNING })
  status: RobotStatus;

  @Column('jsonb', { default: () => `'{"x":0,"y":0}'` })
  coordinates: Coordinates;

  // True while the robot is walking home after a return-home command; the
  // simulator steps it toward the origin instead of wandering randomly, and
  // clears this (going offline) once it arrives.
  @Column({ default: false })
  returningHome: boolean;
}
