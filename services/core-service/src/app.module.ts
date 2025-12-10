import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from './modules/project/project.module';
import { ProjectMemberModule } from './modules/project-member/project-member.module';
import { ReleaseModule } from './modules/release/release.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { SprintModule } from './modules/sprint/sprint.module';
import { IssueModule } from './modules/issue/issue.module';
import { AttachmentModule } from './modules/attachment/attachment.module';
import { CommentModule } from './modules/comment/comment.module';
import { StatusModule } from './modules/status/status.module';
import { TransitionModule } from './modules/transition/transition.module';
import { EventHandlersModule } from './events/event-handlers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT!, 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),

    ProjectModule,
    ProjectMemberModule,
    ReleaseModule,
    SprintModule,
    IssueModule,
    AttachmentModule,
    CommentModule,
    WorkflowModule,
    StatusModule,
    TransitionModule,
    EventHandlersModule,
  ],
})
export class AppModule {}
