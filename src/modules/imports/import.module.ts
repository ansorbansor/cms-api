import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Area } from 'src/entities/area.entity';
import { BiddingArea } from 'src/entities/bidding_area.entity';
import { Customer } from 'src/entities/customer.entity';
import { EmployeePosition } from 'src/entities/employee-position.entity';
import { Operator } from 'src/entities/operator.entity';
import { PD } from 'src/entities/pd.entity';
import { PendingType } from 'src/entities/pending-type.entity';
import { Project } from 'src/entities/project.entity';
import { PurchaseOrderInvoice } from 'src/entities/purchase-order-invoice.entity';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { Region } from 'src/entities/region.entity';
import { RemarkProject } from 'src/entities/remark-project.entity';
import { Site } from 'src/entities/site.entity';
import { StatusAcceptance } from 'src/entities/status-acceptance.entity';
import { User } from 'src/entities/user.entity';
import { ExportJob } from 'src/entities/export-job.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { MailModule } from '../mail/mail.module';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Region,
      PurchaseOrder,
      Area,
      Operator,
      Customer,
      Project,
      Site,
      BiddingArea,
      RemarkProject,
      StatusAcceptance,
      PendingType,
      PD,
      PurchaseOrderInvoice,
      EmployeePosition,
      User,
      ExportJob,
    ]),
    MailModule,
    ActivityLogModule,
  ],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule { }
