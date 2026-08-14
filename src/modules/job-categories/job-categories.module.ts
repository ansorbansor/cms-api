import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobCategory } from '../../entities/job-category.entity';
import { JobCategoriesController } from './job-categories.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([JobCategory]), UsersModule],
  controllers: [JobCategoriesController],
  providers: [],
})
export class JobCategoriesModule {}
