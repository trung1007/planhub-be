import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // await app.listen(process.env.PORT ?? 3000);
    app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'agent-service-consumer',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'agent-service-group',
      },
    },
  });

  await app.startAllMicroservices();
  console.log('🚀 agent-service started');
}
bootstrap();
