import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeLevel } from 'src/entities/employee-level.entity';
import { EmployeeLevelController } from './employee-level.controller';
import { EmployeeLevelService } from './employee-level.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeLevel])],
  controllers: [EmployeeLevelController],
  providers: [EmployeeLevelService],
  exports: [EmployeeLevelService],
})
export class EmployeeLevelModule {}
