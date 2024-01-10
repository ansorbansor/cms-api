import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SPKOperationalRequestTypeController } from './spk-operational-request-type.controller';
import { SPKOperationalRequestTypeService } from './spk-operational-request-type.service';
import { SPKOperationalRequestType } from 'src/entities/spk-operational-request-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SPKOperationalRequestType])],
  controllers: [SPKOperationalRequestTypeController],
  providers: [SPKOperationalRequestTypeService],
  exports: [SPKOperationalRequestTypeService],
})
export class SPKOperationalRequestTypeModule {}
