import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { GraphController } from './graph.controller';
import { GraphService } from './graph.service';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseOrder]), ActivityLogModule],
  controllers: [GraphController],
  providers: [GraphService],
  exports: [],
})
export class GraphModule {}
