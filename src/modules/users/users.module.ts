import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from 'src/modules/users/users.controller';
import { User } from 'src/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';
import { UserRoles } from 'src/entities/user-role.entity';
import { UserTopic } from 'src/entities/user-topic.entity';
import { MailModule } from '../mail/mail.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRoles, UserTopic]),
    MailModule,
    ActivityLogModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
