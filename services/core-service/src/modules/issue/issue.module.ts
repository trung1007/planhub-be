import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from './issue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Issue])],
//   controllers: [SprintController],
//   providers: [SprintService],
//   exports: [ReleaseService],
})
export class IssueModule {}
