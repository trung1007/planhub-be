// core-service/src/job/job.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { AgentProducer } from '../kafka/agent.producer';
import { CreateJobDto } from './create-job.dto';


@Controller('jobs')
export class JobController {
  constructor(private readonly agentProducer: AgentProducer) {}

  @Post()
  async createJob(@Body() body: CreateJobDto) {
    /**
     * HTTP -> Kafka
     */
    const result = await this.agentProducer.sendCommand({
      ok: body.ok,
      data: body.data,
    });

    return {
      message: 'Job sent to agent-service',
      ...result,
    };
  }
}
