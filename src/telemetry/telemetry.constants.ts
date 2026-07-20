import { RobotStatus } from '../fleet/entities/robot-status.enum';
import { Coordinates } from '../fleet/entities/coordinates.interface';

export const TELEMETRY_TOPIC = 'robot-telemetry';
export const TELEMETRY_KAFKA_CLIENT = 'TELEMETRY_KAFKA_CLIENT';
export const TELEMETRY_CONSUMER_GROUP = 'telemetry-consumer';

// Messages are keyed by robotId (see TelemetryProducerService), so a given
// robot's events always land on the same partition and stay in order even
// as this is raised to add consumer parallelism under higher fleet load.
export const DEFAULT_TELEMETRY_TOPIC_PARTITIONS = 6;

export interface TelemetryEventPayload {
  robotId: string;
  status: RobotStatus;
  coordinates: Coordinates;
  returningHome: boolean;
  timestamp: string;
}
