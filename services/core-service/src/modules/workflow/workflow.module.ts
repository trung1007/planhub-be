import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './workflow.entity';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { Project } from '../project/project.entity';
import { Status } from '../status/status.entity';
import { Transition } from '../transition/transition.entity';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow, Project, Status, Transition]), SharedModule],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
