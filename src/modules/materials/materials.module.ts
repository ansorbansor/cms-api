import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialsService } from './materials.service';
import { MaterialsController } from './materials.controller';
import { Material } from '../../entities/material.entity';
import { MaterialTransaction } from '../../entities/material-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Material, MaterialTransaction])],
  controllers: [MaterialsController],
  providers: [MaterialsService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
