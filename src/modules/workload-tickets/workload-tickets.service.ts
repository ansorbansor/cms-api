import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getManager, IsNull } from 'typeorm';
import { WorkloadTicket } from 'src/entities/workload-ticket.entity';
import { Milestone } from 'src/entities/milestone.entity';
import { WorkloadTask } from 'src/entities/workload-task.entity';
import { Site } from 'src/entities/site.entity';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { WorkloadTaskAttachment } from 'src/entities/workload-task-attachment.entity';
import { FileEntity } from 'src/entities/file.entity';
import { failedResponse, successResponse } from 'src/utils/responses';
import { User } from 'src/entities/user.entity';
import moment from 'moment';
import axios from 'axios';
import { exportUniqueId } from 'src/utils/encryption-helper';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class WorkloadTicketsService {
  constructor(
    @InjectRepository(WorkloadTicket)
    private ticketRepo: Repository<WorkloadTicket>,
    @InjectRepository(Milestone)
    private milestoneRepo: Repository<Milestone>,
    @InjectRepository(WorkloadTask)
    private taskRepo: Repository<WorkloadTask>,
    @InjectRepository(Site)
    private siteRepo: Repository<Site>,
    @InjectRepository(PurchaseOrder)
    private poRepo: Repository<PurchaseOrder>,
    @InjectRepository(WorkloadTaskAttachment)
    private attachmentRepo: Repository<WorkloadTaskAttachment>,
    @InjectRepository(FileEntity)
    private fileRepo: Repository<FileEntity>,
    private whatsappService: WhatsappService,
  ) {}

  async create(siteId: number, userId: number, poIds: number[] = []): Promise<WorkloadTicket> {
    const site = await this.siteRepo.findOne(siteId);
    if (!site) throw failedResponse(HttpStatus.BAD_REQUEST, 'Site not found');

    const dateStr = moment().format('YYMMDD');
    const existingCount = await this.ticketRepo.count({
      where: { site_id: siteId }
    });
    
    const sequence = String(existingCount + 1).padStart(4, '0');
    const ticket_id = `${dateStr}_${site.code}-${sequence}`;

    const newTicket = this.ticketRepo.create({
      site_id: siteId,
      created_by: userId,
      status: 'Pending',
      ticket_id: ticket_id,
      created_at: new Date()
    });

    const savedTicket = await this.ticketRepo.save(newTicket);

    if (poIds && poIds.length > 0) {
      const pos = await this.poRepo.findByIds(poIds);
      for (const po of pos) {
        if (po.site_id === siteId) {
          po.workload_ticket_id = savedTicket.id as any;
          await this.poRepo.save(po);
        }
      }
    }

    return savedTicket;
  }

  async addPurchaseOrders(ticketId: number, poIds: number[]): Promise<void> {
    const ticket = await this.ticketRepo.findOne(ticketId);
    if (!ticket) throw failedResponse(HttpStatus.NOT_FOUND, 'Workload ticket not found');

    if (poIds && poIds.length > 0) {
      const pos = await this.poRepo.findByIds(poIds);
      for (const po of pos) {
        if (po.site_id === ticket.site_id) {
          po.workload_ticket_id = ticket.id as any;
          await this.poRepo.save(po);
        }
      }
    }
  }

  async removePurchaseOrder(ticketId: number, poId: number): Promise<void> {
    const po = await this.poRepo.findOne(poId);
    if (!po) throw failedResponse(HttpStatus.NOT_FOUND, 'Purchase order not found');
    if (po.workload_ticket_id !== ticketId) throw failedResponse(HttpStatus.BAD_REQUEST, 'PO is not attached to this ticket');
    
    po.workload_ticket_id = null;
    await this.poRepo.save(po);
  }

  async findAll(query: any = {}): Promise<{ data: WorkloadTicket[], total: number }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const search = query.search || '';

    const qb = this.ticketRepo.createQueryBuilder('wt')
      .leftJoinAndSelect('wt.site', 'site')
      .leftJoinAndSelect('wt.created_by_user', 'created_by_user')
      .leftJoinAndSelect('wt.purchase_orders', 'purchase_orders')
      .leftJoinAndSelect('wt.milestones', 'milestones')
      .leftJoinAndSelect('milestones.tasks', 'tasks')
      .leftJoinAndSelect('tasks.assigned_to_user', 'assigned_to_user')
      .leftJoinAndSelect('tasks.evidence_file', 'evidence_file')
      .leftJoinAndSelect('tasks.attachments', 'attachments')
      .leftJoinAndSelect('attachments.file', 'att_file')
      .orderBy('wt.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where('wt.ticket_id ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async getUnassignedPos(siteId: number): Promise<any[]> {
    const pos = await this.poRepo.find({
      where: { site_id: siteId, workload_ticket_id: IsNull() },
      relations: ['site'],
      order: { created_at: 'DESC' }
    });
    return pos.map(po => {
      const createdAtStr = po.createdAtParseDate || moment(po.created_at).format('YYYY-MM-DD HH:mm:ss');
      return {
        ...po,
        unique_id: exportUniqueId(po.id, createdAtStr)
      };
    });
  }

  async getMyTasks(userId: number, query: any = {}): Promise<{ data: WorkloadTask[], total: number }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const search = query.search || '';

    const qb = this.taskRepo.createQueryBuilder('task')
      .leftJoinAndSelect('task.milestone', 'milestone')
      .leftJoinAndSelect('milestone.workload_ticket', 'workload_ticket')
      .leftJoinAndSelect('workload_ticket.site', 'site')
      .leftJoinAndSelect('task.evidence_file', 'evidence_file')
      .leftJoinAndSelect('task.attachments', 'attachments')
      .leftJoinAndSelect('attachments.file', 'att_file')
      .where('task.assigned_to = :userId', { userId })
      .orderBy('task.created_at', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('workload_ticket.ticket_id ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();

    // Inject the previous task for Pending tasks
    for (const task of data) {
      if (task.status === 'Pending' && task.milestone?.workload_ticket_id) {
        const prevTask = await this.taskRepo.createQueryBuilder('ptask')
          .leftJoinAndSelect('ptask.assigned_to_user', 'user')
          .leftJoin('ptask.milestone', 'pmilestone')
          .where('pmilestone.workload_ticket_id = :ticketId', { ticketId: task.milestone.workload_ticket_id })
          .andWhere('ptask.created_at <= :createdAt AND ptask.id < :taskId', { createdAt: task.created_at, taskId: task.id })
          .orderBy('ptask.created_at', 'DESC')
          .addOrderBy('ptask.id', 'DESC')
          .getOne();

        if (prevTask) {
          (task as any).previous_task = prevTask;
        }
      }
    }

    return { data, total };
  }

  async getUniqueTaskNames(): Promise<string[]> {
    const results = await this.taskRepo.createQueryBuilder('task')
      .select('DISTINCT(task.name)', 'name')
      .where('task.name IS NOT NULL')
      .orderBy('task.name', 'ASC')
      .getRawMany();
    return results.map(r => r.name);
  }

  async findOne(id: number): Promise<WorkloadTicket> {
    const ticket = await this.ticketRepo.findOne(id, {
      relations: [
        'site', 
        'purchase_orders', 
        'milestones', 
        'milestones.tasks', 
        'milestones.tasks.assigned_to_user',
        'milestones.tasks.evidence_file',
        'milestones.tasks.attachments',
        'milestones.tasks.attachments.file'
      ]
    });
    if (!ticket) throw failedResponse(HttpStatus.NOT_FOUND, 'Ticket not found');
    
    if (ticket.milestones) {
      ticket.milestones.sort((a, b) => a.order_index - b.order_index);
      for (const m of ticket.milestones) {
        if (m.tasks) m.tasks.sort((a, b) => a.task_order_index - b.task_order_index);
      }
    }
    if (ticket.purchase_orders) {
      ticket.purchase_orders = ticket.purchase_orders.map(po => {
        const createdAtStr = po.createdAtParseDate || moment(po.created_at).format('YYYY-MM-DD HH:mm:ss');
        return {
          ...po,
          unique_id: exportUniqueId(po.id, createdAtStr)
        } as any;
      });
    }
    return ticket;
  }

  async addMilestone(ticketId: number, name: string): Promise<Milestone> {
    const ticket = await this.ticketRepo.findOne(ticketId, { relations: ['milestones'] });
    if (!ticket) throw failedResponse(HttpStatus.NOT_FOUND, 'Ticket not found');

    const count = ticket.milestones ? ticket.milestones.length : 0;
    const milestone = this.milestoneRepo.create({
      workload_ticket_id: ticketId,
      name,
      order_index: count + 1,
      status: count === 0 ? 'Active' : 'Pending',
    });
    return await this.milestoneRepo.save(milestone);
  }

  async reorderMilestones(ticketId: number, orderIds: number[]): Promise<void> {
    for (let i = 0; i < orderIds.length; i++) {
       await this.milestoneRepo.update(orderIds[i], { order_index: i + 1 });
    }
  }

  async editMilestone(id: number, name: string): Promise<Milestone> {
    const milestone = await this.milestoneRepo.findOne(id);
    if (!milestone) throw failedResponse(HttpStatus.NOT_FOUND, 'Milestone not found');
    milestone.name = name;
    return await this.milestoneRepo.save(milestone);
  }

  async deleteMilestone(id: number): Promise<void> {
    await this.milestoneRepo.delete(id);
  }

  async addTask(milestoneId: number, payload: any): Promise<WorkloadTask> {
    const milestone = await this.milestoneRepo.findOne(milestoneId, { relations: ['tasks'] });
    if (!milestone) throw failedResponse(HttpStatus.NOT_FOUND, 'Milestone not found');

    const count = milestone.tasks ? milestone.tasks.length : 0;
    const isFirstActiveTask = (count === 0 && milestone.status === 'Active');
    
    const task = this.taskRepo.create({
      milestone_id: milestoneId,
      name: payload.name,
      assigned_to: payload.assigned_to,
      deadline: payload.deadline,
      status: isFirstActiveTask ? 'In Progress' : 'Pending',
      task_order_index: count + 1,
    });
    const savedTask = await this.taskRepo.save(task);

    // Notify if this task becomes 'In Progress' immediately
    if (isFirstActiveTask) {
      const user = await getManager().getRepository(User).findOne(payload.assigned_to);
      if (user && user.phone) {
        await this.sendWhatsappNotification(user.phone, `Hai ${user.name}! Tugas anda: ${savedTask.name} pada tiket tugas kini siap dikerjakan.`);
      }
    }

    return savedTask;
  }

  async deleteTask(id: number): Promise<void> {
    await this.taskRepo.delete(id);
  }

  async updateTaskStatus(taskId: number, payload: any): Promise<any> {
    const task = await this.taskRepo.findOne(taskId, { relations: ['milestone'] });
    if (!task) throw failedResponse(HttpStatus.NOT_FOUND, 'Task not found');
    
    if (payload.status === 'Completed' && !payload.evidence_file_id) {
       throw failedResponse(HttpStatus.BAD_REQUEST, 'Evidence file is required for Completed status');
    }
    if ((payload.status === 'Issue' || payload.status === 'No Need') && !payload.watermark_notes) {
       throw failedResponse(HttpStatus.BAD_REQUEST, 'Watermark notes required for Issue/No Need status');
    }

    if (payload.status) task.status = payload.status;
    if (payload.evidence_file_id) task.evidence_file_id = payload.evidence_file_id;
    if (payload.watermark_notes) task.watermark_notes = payload.watermark_notes;
    
    await this.taskRepo.save(task);

    if (payload.status === 'Completed' || payload.status === 'No Need') {
      await this.handleNextTaskNotification(task);
    }
    return { success: true };
  }

  async addTaskAttachment(taskId: number, fileId: number): Promise<WorkloadTaskAttachment> {
    const task = await this.taskRepo.findOne(taskId);
    if (!task) throw failedResponse(HttpStatus.NOT_FOUND, 'Task not found');
    const file = await this.fileRepo.findOne(fileId);
    if (!file) throw failedResponse(HttpStatus.NOT_FOUND, 'File not found');

    const attachment = this.attachmentRepo.create({ task_id: taskId, file_id: fileId });
    return this.attachmentRepo.save(attachment);
  }

  async removeTaskAttachment(taskId: number, attachmentId: number): Promise<void> {
    const attachment = await this.attachmentRepo.findOne(attachmentId);
    if (!attachment || attachment.task_id !== taskId)
      throw failedResponse(HttpStatus.NOT_FOUND, 'Attachment not found');
    await this.attachmentRepo.remove(attachment);
  }

  private async handleNextTaskNotification(currentTask: WorkloadTask) {
    const nextTask = await this.taskRepo.findOne({
      where: { 
        milestone_id: currentTask.milestone_id, 
        task_order_index: currentTask.task_order_index + 1 
      },
      relations: ['assigned_to_user']
    });

    if (nextTask) {
      nextTask.status = 'In Progress';
      await this.taskRepo.save(nextTask);
      if (nextTask.assigned_to_user && nextTask.assigned_to_user.phone) {
          await this.sendWhatsappNotification(nextTask.assigned_to_user.phone, `Hai ${nextTask.assigned_to_user.name}! Tugas anda: ${nextTask.name} pada tiket tugas kini siap dikerjakan.`);
      }
    } else {
      const currentMilestone = await this.milestoneRepo.findOne(currentTask.milestone_id);
      currentMilestone.status = 'Completed';
      await this.milestoneRepo.save(currentMilestone);

      const nextMilestone = await this.milestoneRepo.findOne({
        where: {
           workload_ticket_id: currentMilestone.workload_ticket_id,
           order_index: currentMilestone.order_index + 1
        }
      });

      if (nextMilestone) {
        nextMilestone.status = 'Active';
        await this.milestoneRepo.save(nextMilestone);
        
        const firstTask = await this.taskRepo.findOne({
          where: { milestone_id: nextMilestone.id, task_order_index: 1 },
          relations: ['assigned_to_user']
        });
        if (firstTask) {
          firstTask.status = 'In Progress';
          await this.taskRepo.save(firstTask);
          if (firstTask.assigned_to_user && firstTask.assigned_to_user.phone) {
             await this.sendWhatsappNotification(firstTask.assigned_to_user.phone, `Hai ${firstTask.assigned_to_user.name}! Milestone baru dimulai. Tugas anda: ${firstTask.name} kini siap dikerjakan.`);
          }
        }
      } else {
        await getManager().update(WorkloadTicket, currentMilestone.workload_ticket_id, { status: 'Completed' });
      }
    }
  }

  private async sendWhatsappNotification(phoneNumber: string, message: string) {
    try {
      await this.whatsappService.sendMessage(phoneNumber, message);
    } catch (e) {
      console.error('Failed to send Whatsapp', e);
    }
  }
}
