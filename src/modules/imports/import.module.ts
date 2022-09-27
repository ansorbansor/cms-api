import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from 'src/entities/course.entity';
import { EmployeeLevel } from 'src/entities/employee-level.entity';
import { EmployeePosition } from 'src/entities/employee-position.entity';
import { EmployeeUnit } from 'src/entities/employee-unit.entity';
import { Provider } from 'src/entities/provider.entity';
import { Role } from 'src/entities/role.entity';
import { User } from 'src/entities/user.entity';
import { MailModule } from '../mail/mail.module';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      EmployeeLevel,
      EmployeeUnit,
      EmployeePosition,
      Provider,
      Course,
    ]),
    MailModule,
  ],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
