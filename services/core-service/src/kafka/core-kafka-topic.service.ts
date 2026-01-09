import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class CoreKafkaTopicService implements OnModuleInit {
  private kafka = new Kafka({
    brokers: ['localhost:9092'],
  });

  async onModuleInit() {
    const admin = this.kafka.admin();
    await admin.connect();

    await admin.createTopics({
      topics: [
        {
          topic: 'agent.command',
          numPartitions: 3,
          replicationFactor: 1,
        },
        {
          topic: 'agent.reply',
          numPartitions: 3,
          replicationFactor: 1,
        },
      ],
    });

    await admin.disconnect();
  }
}
