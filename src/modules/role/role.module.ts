import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleAccess } from 'src/entities/role-access.entity';
import { Role } from 'src/entities/role.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, RoleAccess]), ActivityLogModule],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
