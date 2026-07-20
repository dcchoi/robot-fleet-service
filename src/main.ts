import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Kafka } from 'kafkajs';
import { AppModule } from './app.module';
import {
  DEFAULT_TELEMETRY_TOPIC_PARTITIONS,
  TELEMETRY_CONSUMER_GROUP,
  TELEMETRY_TOPIC,
} from './telemetry/telemetry.constants';

async function ensureTelemetryTopicExists(brokers: string[]): Promise<void> {
  const partitions = Number(
    process.env.TELEMETRY_TOPIC_PARTITIONS ??
      DEFAULT_TELEMETRY_TOPIC_PARTITIONS,
  );
  const admin = new Kafka({ brokers }).admin();
  await admin.connect();
  try {
    // No-op if the topic already exists (e.g. a persistent broker from a
    // prior deploy), so partition count can't be raised this way alone.
    await admin.createTopics({
      topics: [{ topic: TELEMETRY_TOPIC, numPartitions: partitions }],
      waitForLeaders: true,
    });
    try {
      await admin.createPartitions({
        topicPartitions: [{ topic: TELEMETRY_TOPIC, count: partitions }],
      });
    } catch {
      // Already at or above the target partition count — expected steady
      // state once the topic has been created with `partitions` before.
    }
  } finally {
    await admin.disconnect();
  }
}

async function bootstrap() {
  const brokers = [process.env.KAFKA_BROKER ?? 'localhost:9092'];
  // The consumer subscribes on startup; without this the app can crash on a
  // fresh Kafka broker if the topic doesn't exist yet when it subscribes.
  await ensureTelemetryTopicExists(brokers);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useStaticAssets(join(__dirname, 'public'));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: { brokers },
      consumer: {
        groupId: TELEMETRY_CONSUMER_GROUP,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
