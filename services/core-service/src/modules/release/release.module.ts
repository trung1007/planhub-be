import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Release } from './release.entity';
import { ReleaseController } from './release.controller';
import { ReleaseService } from './release.service';
import { Project } from '../project/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Release, Project])],
 controllers: [ReleaseController],
  providers: [ReleaseService],
  exports: [ReleaseService],
})
export class ReleaseModule {}
