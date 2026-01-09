import { Module } from '@nestjs/common';
import { SubtasksController } from './subtasks.controller';
import { GeminiSubtasksService } from './gemini-subtasks.service';

@Module({
  controllers: [SubtasksController],
  providers: [GeminiSubtasksService],
  exports: [GeminiSubtasksService],
})
export class SubtasksModule {}
