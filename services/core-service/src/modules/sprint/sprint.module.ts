import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sprint } from './sprint.entity';
import { ReleaseController } from '../release/release.controller';
import { ReleaseService } from '../release/release.service';


@Module({
  imports: [TypeOrmModule.forFeature([Sprint])],
//   controllers: [ReleaseController],
//   providers: [ReleaseService],
//   exports: [ReleaseService],
})
export class SprintModule {}
