import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AgentProducer } from './agent.producer';
import { AgentReplyConsumer } from './agent-reply.consumer';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'core-service-producer',
            brokers: ['localhost:9092'],
          },
          producerOnlyMode: true,
        },
      },
    ]),
  ],
  controllers: [AgentReplyConsumer],
  providers: [AgentProducer],
  exports: [AgentProducer],
})
export class KafkaModule {}
