import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { Customer } from 'src/entities/customer.entity';
import { PurchaseOrderInvoice } from 'src/entities/purchase-order-invoice.entity';
import { POCustomColumn } from 'src/entities/po-custom-column.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrder,
      Customer,
      PurchaseOrderInvoice,
      POCustomColumn,
    ]),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
