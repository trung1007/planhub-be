import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AgentConsumer } from './agent.consumer';
import { RetryConsumer } from './retry.consumer';

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
        },
      },
    ]),
  ],
  providers: [AgentConsumer, RetryConsumer],
})
export class KafkaModule {}
