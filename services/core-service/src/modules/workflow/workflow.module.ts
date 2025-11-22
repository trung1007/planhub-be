import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './workflow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow])],
//   controllers: [ProjectController],
//   providers: [ProjectService],
//   exports: [ProjectService],
})
export class WorkflowModule {}
