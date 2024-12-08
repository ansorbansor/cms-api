import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SPKOperationalCategoryController } from './spk-operational-category.controller';
import { SPKOperationalCategoryService } from './spk-operational-category.service';
import { SPKOperationalCategory } from 'src/entities/spk-operational-category.entity';
import { SPKOperationalSubCategory } from 'src/entities/spk-operational-subcategory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SPKOperationalCategory,
      SPKOperationalSubCategory,
    ]),
  ],
  controllers: [SPKOperationalCategoryController],
  providers: [SPKOperationalCategoryService],
  exports: [SPKOperationalCategoryService],
})
export class SPKOperationalCategoryModule { }
