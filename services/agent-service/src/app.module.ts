import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubtasksModule } from './subtasks/subtasks.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
    }),

    SubtasksModule,
    KafkaModule

  ],
})
export class AppModule {}
