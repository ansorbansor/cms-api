import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { SPK } from 'src/entities/spk.entity';
import { User } from 'src/entities/user.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PurchaseOrder, SPK]),
    ActivityLogModule,
  ],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
