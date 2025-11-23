import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ReleaseService } from './release.service';
import { ActionReleaseDto } from './dto/action-release.dto';

@Controller('releases')
export class ReleaseController {
  constructor(private readonly releaseService: ReleaseService) {}

  @Post()
  async create(@Body() dto: ActionReleaseDto) {
    return this.releaseService.create(dto);
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.releaseService.findAll(Number(page), Number(limit));
  }

  @Get('release-list')
  findList() {
    return this.releaseService.findList();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.releaseService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActionReleaseDto,
  ) {
    return this.releaseService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.releaseService.delete(id);
  }
}
