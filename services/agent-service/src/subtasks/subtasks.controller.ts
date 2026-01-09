import { Body, Controller, Post } from '@nestjs/common';
import { GeminiSubtasksService } from './gemini-subtasks.service';

type GenerateSubtasksBody = {
  run_id: string;
  issue: {
    id?: number;
    type?: string;
    name: string;
    summary?: string | null;
    description?: string | null;
    tags?: string[] | null;
    priority?: string | null;
  };
  max_subtasks?: number;      // optional
  language?: 'vi' | 'en';     // optional
};

@Controller()
export class SubtasksController {
  constructor(private readonly service: GeminiSubtasksService) {}

  @Post('/subtasks/generate')
  async generate(@Body() body: any) {
    return this.service.generate(body);
  }
}
