import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialsService } from './materials.service';
import { MaterialsController } from './materials.controller';
import { Material } from '../../entities/material.entity';
import { MaterialTransaction } from '../../entities/material-transaction.entity';
import { ExportJob } from '../../entities/export-job.entity';
import { User } from '../../entities/user.entity';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Material, MaterialTransaction, ExportJob, User]),
    FilesModule,
  ],
  controllers: [MaterialsController],
  providers: [MaterialsService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
