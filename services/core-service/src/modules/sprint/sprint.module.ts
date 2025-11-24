import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sprint } from './sprint.entity';
import { ReleaseService } from '../release/release.service';
import { SprintController } from './sprint.controller';
import { SprintService } from './sprint.service';
import { Release } from '../release/release.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sprint, Release])],
  controllers: [SprintController],
  providers: [SprintService],
  exports: [SprintService],
})
export class SprintModule {}
 