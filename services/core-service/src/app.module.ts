import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from './modules/project/project.module';
import { ProjectMemberModule } from './modules/project-member/project-member.module';
import { ReleaseModule } from './modules/release/release.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { SprintModule } from './modules/sprint/sprint.module';

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
    RouterModule.register([
      {
        path: 'core-service',
        module: ProjectModule,
      },
      {
        path: 'core-service',
        module: ProjectMemberModule,
      },
        {
        path: 'core-service',
        module: ReleaseModule,
      },
    ]),
    
    ProjectModule, 
    ProjectMemberModule,
    ReleaseModule,
    SprintModule,
    WorkflowModule
  ],
})
export class AppModule {}
