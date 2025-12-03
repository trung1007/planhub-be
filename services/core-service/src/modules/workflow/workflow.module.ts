import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './workflow.entity';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { Project } from '../project/project.entity';
import { Status } from '../status/status.entity';
import { Transition } from '../transition/transition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow, Project, Status, Transition])],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
