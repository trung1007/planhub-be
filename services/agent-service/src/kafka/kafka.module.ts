import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AgentConsumer } from './agent.consumer';
import { RetryConsumer } from './retry.consumer';
import { SubtasksModule } from 'src/subtasks/subtasks.module';
import { AgentKafkaTopicService } from './agent-kafka-topic.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'agent-service-producer',
            brokers: ['localhost:9092'],
          },
          producerOnlyMode: true,
        },
      },
    ]),
    SubtasksModule
  ],
  controllers: [AgentConsumer, RetryConsumer],
  providers:[AgentKafkaTopicService]
})
export class KafkaModule {}
