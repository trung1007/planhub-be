import { Module } from '@nestjs/common';
import { SubtasksController } from './subtasks.controller';
import { OpenAiSubtasksService } from './openai-subtasks.service';
import { GeminiSubtasksService } from './gemini-subtasks.service';

@Module({
  controllers: [SubtasksController],
  providers: [GeminiSubtasksService],
})
export class SubtasksModule {}
