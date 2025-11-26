import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './attachment.entity';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,
  ) {}

  async create(dto: CreateAttachmentDto): Promise<Attachment> {
    
    const attachment = this.attachmentRepo.create({
      ...dto,
      issue_id:dto.issueId,
      file_data: dto.file_data,
    });
    
    return this.attachmentRepo.save(attachment);
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

  async delete(id: number): Promise<void> {
    const attachment = await this.findOne(id);
    await this.attachmentRepo.remove(attachment);
  }
}
