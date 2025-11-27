import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  Get,
  Query,
  UseInterceptors,
  UploadedFile,
  StreamableFile,
  Req,
} from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import type { CreateAttachmentDto } from './dto/create-attachment.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { BadRequestException } from '@nestjs/common';
import type { Express } from 'express';
import { Readable } from 'stream';

@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // Giới hạn 10MB
      },
    }),
  )
  async create(
    @Body() dto: any, // Các trường ngoài file
    @UploadedFile() file: Express.Multer.File, // File upload
    @Req() req,
  ) {
    const user_id = Number(req.headers['x-user-id']);
    // Kiểm tra nếu không có file
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Kiểm tra nếu file không có buffer (dữ liệu nhị phân)
    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing');
    }

    // Tạo DTO để lưu file vào DB
    const attachmentDto: CreateAttachmentDto = {
      ...dto,
      file_name: file.originalname,
      file_data: file.buffer,
      mime_type: file.mimetype,
    };

    // Lưu file vào DB
    return this.attachmentService.create(attachmentDto, user_id);
  }

  @Get('issue/:issueId')
  async findByIssueId(@Param('issueId') issueId: number) {
    return this.attachmentService.findByIssueId(issueId);
  }

  @Get('download/:id')
  async download(@Param('id') id: number): Promise<StreamableFile> {
    const file = await this.attachmentService.findOne(id);

    const stream = Readable.from(file.file_data);

    return new StreamableFile(stream, {
      type: file.mime_type || 'application/octet-stream',
      disposition: `attachment; filename="${file.file_name}"`,
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: number, @Req() req) {
    const user_id = Number(req.headers['x-user-id']);
    return this.attachmentService.delete(id, user_id);
  }
}
