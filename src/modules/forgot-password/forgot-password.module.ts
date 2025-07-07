import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForgotPassword } from 'src/entities/forgot-password.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { ForgotPasswordService } from './forgot-password.service';

@Module({
  imports: [TypeOrmModule.forFeature([ForgotPassword]), ActivityLogModule],
  providers: [ForgotPasswordService],
  exports: [ForgotPasswordService],
})
export class ForgotPasswordModule {}
