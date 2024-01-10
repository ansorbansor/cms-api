import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SPKOperationalCategoryController } from './spk-operational-category.controller';
import { SPKOperationalCategoryService } from './spk-operational-category.service';
import { SPKOperationalCategory } from 'src/entities/spk-operational-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SPKOperationalCategory])],
  controllers: [SPKOperationalCategoryController],
  providers: [SPKOperationalCategoryService],
  exports: [SPKOperationalCategoryService],
})
export class SPKOperationalCategoryModule {}
