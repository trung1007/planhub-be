import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueHistory } from './issue-history.entity';
import { IssueHistoryService } from './issue-history.service';
import { IssueHistoryListener } from './issue-history.listener';
import { IssueHistoryController } from './issue-history.controller';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([IssueHistory]),
    SharedModule,
  ],
  providers: [IssueHistoryService, IssueHistoryListener],
  controllers: [IssueHistoryController],
  exports: [IssueHistoryService],
})
export class IssueHistoryModule {}
