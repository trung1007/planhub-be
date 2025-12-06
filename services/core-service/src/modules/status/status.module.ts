import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Status } from './status.entity';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { Sprint } from '../sprint/sprint.entity';
import { Release } from '../release/release.entity';
import { Project } from '../project/project.entity';
import { Workflow } from '../workflow/workflow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Status, Sprint, Release, Project, Workflow])],
  controllers: [StatusController],
  providers: [StatusService],
})
export class StatusModule {}
