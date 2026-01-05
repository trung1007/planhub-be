// core-service/src/job/job.module.ts
import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [KafkaModule],
  controllers: [JobController],
})
export class JobModule {}
