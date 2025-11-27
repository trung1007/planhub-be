import { Module } from '@nestjs/common';
import { AttachmentController } from './attachment.controller';
import { Attachment } from './attachment.entity';
import { AttachmentService } from './attachment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueHistoryModule } from '../issue-history/issue-history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),
    IssueHistoryModule
  ],
  controllers: [AttachmentController],
  providers: [AttachmentService],
  exports: [AttachmentService],
})
export class AttachmentModule {}
