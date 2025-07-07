import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operator } from 'src/entities/operator.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { OperatorController } from './operator.controller';
import { OperatorService } from './operator.service';

@Module({
  imports: [TypeOrmModule.forFeature([Operator]), ActivityLogModule],
  controllers: [OperatorController],
  providers: [OperatorService],
  exports: [],
})
export class OperatorModule {}
