import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeePosition } from 'src/entities/employee-position.entity';
import { Role } from 'src/entities/role.entity';
import { UserRoles } from 'src/entities/user-role.entity';
import { User } from 'src/entities/user.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { MailModule } from '../mail/mail.module';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, EmployeePosition, UserRoles]),
    MailModule,
    ActivityLogModule,
  ],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
