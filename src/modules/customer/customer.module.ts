import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from 'src/entities/customer.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), ActivityLogModule],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [],
})
export class CustomerModule {}
