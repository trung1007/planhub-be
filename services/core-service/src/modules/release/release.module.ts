import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Release } from './release.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Release])],
//   controllers: [ProjectController],
//   providers: [ProjectService],
//   exports: [ProjectService],
})
export class ReleaseModule {}
