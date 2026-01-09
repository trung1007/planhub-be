import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class AgentKafkaTopicService implements OnModuleInit {
  private kafka = new Kafka({
    brokers: ['localhost:9092'],
  });

  async onModuleInit() {
    const admin = this.kafka.admin();
    await admin.connect();

    await admin.createTopics({
      topics: [
        {
          topic: 'agent.command.retry',
          numPartitions: 1, // retry không cần nhiều
          replicationFactor: 1,
        },
        {
          topic: 'agent.command.dlq',
          numPartitions: 1,
          replicationFactor: 1,
        },
      ],
    });

    await admin.disconnect();
  }
}
