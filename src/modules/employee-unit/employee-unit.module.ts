import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeUnit } from 'src/entities/employee-unit.entity';
import { EmployeeUnitController } from './employee-unit.controller';
import { EmployeeUnitService } from './employee-unit.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeUnit])],
  controllers: [EmployeeUnitController],
  providers: [EmployeeUnitService],
  exports: [EmployeeUnitService],
})
export class EmployeeUnitModule {}
