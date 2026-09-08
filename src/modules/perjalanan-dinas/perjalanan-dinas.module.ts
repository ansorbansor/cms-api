import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerjalananDinas } from 'src/entities/perjalanan-dinas.entity';
import { PerjalananDinasController } from './perjalanan-dinas.controller';
import { PerjalananDinasService } from './perjalanan-dinas.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([PerjalananDinas]), ActivityLogModule],
  controllers: [PerjalananDinasController],
  providers: [PerjalananDinasService],
})
export class PerjalananDinasModule {}
