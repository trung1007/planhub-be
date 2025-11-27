import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './attachment.entity';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { NotFoundException } from '@nestjs/common';
import { IssueHistoryService } from '../issue-history/issue-history.service';
import { HistoryEvent } from '../issue-history/issue-history.event';
import {
  HistoryAction,
  HistoryEntity,
} from '../issue-history/issue-history.entity';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,

    private readonly historyService: IssueHistoryService,
  ) {}

  async create(dto: CreateAttachmentDto, user_id: number): Promise<Attachment> {
    const attachment = this.attachmentRepo.create({
      ...dto,
      issue_id: dto.issueId,
      file_data: dto.file_data,
    });
    const saved = await this.attachmentRepo.save(attachment);

    // 🔥 Emit history event
    this.historyService.log(
      new HistoryEvent(
        saved.issue_id,
        HistoryEntity.ATTACHMENT,
        saved.id,
        HistoryAction.ATTACHMENT_ADD,
        user_id,
        null,
        null,
        null,
        {
          file_name: saved.file_name,
          mime_type: saved.mime_type,
        },
      ),
    );

    return saved;
  }

  async findByIssueId(issueId: number): Promise<Attachment[]> {
    return this.attachmentRepo.find({ where: { issue_id: issueId } });
  }

  async findOne(id: number): Promise<Attachment> {
    const attachment = await this.attachmentRepo.findOne({ where: { id } });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    return attachment;
  }

  // async delete(id: number): Promise<void> {
  //   const attachment = await this.findOne(id);
  //   await this.attachmentRepo.remove(attachment);
  // }
  async delete(id: number, user_id: number): Promise<void> {
    const attachment = await this.findOne(id);

    await this.attachmentRepo.remove(attachment);

    // 🔥 Emit history event
    this.historyService.log(
      new HistoryEvent(
        attachment.issue_id,
        HistoryEntity.ATTACHMENT,
        attachment.id,
        HistoryAction.ATTACHMENT_DELETE,
        user_id,
        null,
        null,
        null,
        {
          file_name: attachment.file_name,
        },
      ),
    );
  }
}
