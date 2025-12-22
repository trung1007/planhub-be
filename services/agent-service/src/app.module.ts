import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubtasksModule } from './subtasks/subtasks.module';

@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
    }),

    SubtasksModule

  ],
})
export class AppModule {}
