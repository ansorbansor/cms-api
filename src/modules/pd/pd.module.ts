import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PD } from 'src/entities/pd.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { PDController } from './pd.controller';
import { PDService } from './pd.service';

@Module({
  imports: [TypeOrmModule.forFeature([PD]), ActivityLogModule],
  controllers: [PDController],
  providers: [PDService],
  exports: [],
})
export class PDModule {}
