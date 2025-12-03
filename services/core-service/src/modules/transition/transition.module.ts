import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transition } from './transition.entity';
import { TransitionService } from './transition.service';
import { TransitionController } from './transition.controller';
import { Status } from '../status/status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transition, Status])],
  controllers: [TransitionController],
  providers: [TransitionService],
})
export class TransitionModule {}
