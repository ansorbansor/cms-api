import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkloadTicket } from 'src/entities/workload-ticket.entity';
import { WorkloadTicketsCronService } from './workload-tickets.cron.service';
import { Milestone } from 'src/entities/milestone.entity';
import { WorkloadTask } from 'src/entities/workload-task.entity';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { WorkloadTicketsService } from './workload-tickets.service';
import { WorkloadTicketsController } from './workload-tickets.controller';
import { Site } from 'src/entities/site.entity';
import { WorkloadTaskAttachment } from 'src/entities/workload-task-attachment.entity';
import { FileEntity } from 'src/entities/file.entity';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([WorkloadTicket, Milestone, WorkloadTask, PurchaseOrder, Site, WorkloadTaskAttachment, FileEntity]), WhatsappModule, UsersModule],
  controllers: [WorkloadTicketsController],
  providers: [WorkloadTicketsService, WorkloadTicketsCronService],
  exports: [WorkloadTicketsService],
})
export class WorkloadTicketsModule { }
