import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { PurchaseOrderController } from './purchase-orders.controller';
import { PurchaseOrderService } from './purchase-orders.service';
import { PurchaseOrderInvoice } from 'src/entities/purchase-order-invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder, PurchaseOrderInvoice]),
    ActivityLogModule,
  ],
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService],
  exports: [],
})
export class PurchaseOrdersModule {}
