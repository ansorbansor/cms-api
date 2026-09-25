import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialsService } from './materials.service';
import { MaterialsController } from './materials.controller';
import { Material } from '../../entities/material.entity';
import { MaterialTransaction } from '../../entities/material-transaction.entity';
import { ExportJob } from '../../entities/export-job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Material, MaterialTransaction, ExportJob])],
  controllers: [MaterialsController],
  providers: [MaterialsService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
