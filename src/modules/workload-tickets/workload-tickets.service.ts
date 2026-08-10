import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getManager, IsNull, In, Brackets } from 'typeorm';
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
import { Absence } from 'src/entities/absence.entity';
import { DistanceTracking } from '../distance-tracking/entities/distance-tracking.entity';

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
    @InjectRepository(Absence)
    private absenceRepo: Repository<Absence>,
    @InjectRepository(DistanceTracking)
    private distanceTrackingRepo: Repository<DistanceTracking>,
    private whatsappService: WhatsappService,
  ) { }

  async create(siteId: number, userId: number, poIds: number[] = [], templateId?: number): Promise<WorkloadTicket> {
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
          if (!po.actual_work_date) {
            po.actual_work_date = new Date();
          }
          await this.poRepo.save(po);
        }
      }
    }

    if (templateId) {
      await this.copyMilestones(savedTicket.id, templateId);
    }

    return savedTicket;
  }

  async createTemplate(name: string, userId: number): Promise<WorkloadTicket> {
    const newTemplate = this.ticketRepo.create({
      template_name: name,
      is_template: true,
      created_by: userId,
      status: 'Pending',
      created_at: new Date()
    });
    return this.ticketRepo.save(newTemplate);
  }

  async findAllTemplates(): Promise<WorkloadTicket[]> {
    return this.ticketRepo.find({
      where: { is_template: true },
      order: { created_at: 'DESC' }
    });
  }

  async addPurchaseOrders(ticketId: number, poIds: number[]): Promise<void> {
    const ticket = await this.ticketRepo.findOne(ticketId);
    if (!ticket) throw failedResponse(HttpStatus.NOT_FOUND, 'Workload ticket not found');

    if (poIds && poIds.length > 0) {
      const pos = await this.poRepo.findByIds(poIds);
      for (const po of pos) {
        if (po.site_id === ticket.site_id) {
          po.workload_ticket_id = ticket.id as any;
          if (!po.actual_work_date) {
            po.actual_work_date = new Date();
          }
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
    const customer_id = query.customer_id;
    const project_id = query.project_id;

    const qb = this.ticketRepo.createQueryBuilder('wt')
      .leftJoinAndSelect('wt.site', 'site')
      .leftJoinAndSelect('wt.created_by_user', 'created_by_user')
      .leftJoinAndSelect('wt.purchase_orders', 'purchase_orders')
      .leftJoinAndSelect('purchase_orders.customer', 'customer')
      .leftJoinAndSelect('purchase_orders.project', 'project')
      .leftJoinAndSelect('wt.milestones', 'milestones')
      .leftJoinAndSelect('milestones.tasks', 'tasks')
      .leftJoinAndSelect('tasks.assigned_to_user', 'assigned_to_user')
      .leftJoinAndSelect('tasks.evidence_file', 'evidence_file')
      .leftJoinAndSelect('tasks.attachments', 'attachments')
      .leftJoinAndSelect('attachments.file', 'att_file')
      .leftJoinAndSelect('tasks.assigned_multiple', 'assigned_multiple')
      .where('wt.is_template = false')
      .orderBy('wt.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('wt.ticket_id ILIKE :search', { search: `%${search}%` });
    }

    if (customer_id) {
      qb.andWhere('purchase_orders.id IS NOT NULL')
        .andWhere('customer.id = :customerId', { customerId: customer_id });
    }

    if (project_id) {
      qb.andWhere('purchase_orders.id IS NOT NULL')
        .andWhere('project.id = :projectId', { projectId: project_id });
    }

    const [data, total] = await qb.getManyAndCount();

    if (data && data.length > 0) {
      data.forEach(ticket => {
        if (ticket.purchase_orders) {
          ticket.purchase_orders = ticket.purchase_orders.map(po => {
            const createdAtStr = (po as any).createdAtParseDate || moment(po.created_at).format('YYYY-MM-DD HH:mm:ss');
            return {
              ...po,
              unique_id: exportUniqueId(po.id, createdAtStr)
            } as any;
          });
        }
      });
    }

    return { data, total };
  }

  async getSummary(query: any = {}): Promise<any> {
    const search = query.search || '';
    const customer_id = query.customer_id;
    const project_id = query.project_id;

    const buildBaseQb = (alias: string) => {
      const qb = this.ticketRepo.createQueryBuilder(alias)
        .leftJoin(`${alias}.purchase_orders`, 'purchase_orders')
        .leftJoin('purchase_orders.customer', 'customer')
        .leftJoin('purchase_orders.project', 'project')
        .where(`${alias}.is_template = false`);
      
      if (search) {
        qb.andWhere(`${alias}.ticket_id ILIKE :search`, { search: `%${search}%` });
      }
      if (customer_id) {
        qb.andWhere('customer.id = :customerId', { customerId: customer_id });
      }
      if (project_id) {
        qb.andWhere('project.id = :projectId', { projectId: project_id });
      }
      return qb;
    };

    const qbCreator = buildBaseQb('wt')
      .leftJoin('wt.created_by_user', 'created_by_user')
      .select('wt.id', 'id')
      .addSelect('wt.ticket_id', 'ticket_id')
      .addSelect('wt.status', 'status')
      .addSelect('COALESCE(created_by_user.name, created_by_user.nik, \'System\')', 'creator');

    const rawTickets = await qbCreator.getRawMany();

    const uniqueTicketsMap = new Map();
    for (const row of rawTickets) {
      if (!uniqueTicketsMap.has(row.id)) {
        uniqueTicketsMap.set(row.id, {
          id: row.id,
          ticket_id: row.ticket_id,
          status: row.status,
          creator: row.creator
        });
      }
    }
    const uniqueTickets = Array.from(uniqueTicketsMap.values());

    let totalTickets = uniqueTickets.length;
    let completedTickets = 0;
    let inProgressTickets = 0;
    let pendingTickets = 0;

    const totalTicketsList = [];
    const completedTicketsList = [];
    const inProgressTicketsList = [];
    const pendingTicketsList = [];

    uniqueTickets.forEach(t => {
      const tItem = { id: t.id, ticket_id: t.ticket_id, creator: t.creator, status: t.status };
      totalTicketsList.push(tItem);
      if (t.status === 'Completed' || t.status === 'Confirmed Finished') {
        completedTickets++;
        completedTicketsList.push(tItem);
      } else if (t.status === 'In Progress') {
        inProgressTickets++;
        inProgressTicketsList.push(tItem);
      } else {
        pendingTickets++;
        pendingTicketsList.push(tItem);
      }
    });

    const ticketsByCreator: { name: string, count: number, tickets: any[] }[] = [];
    const inProgressByCreator: { name: string, count: number, tickets: any[] }[] = [];
    const pendingByCreator: { name: string, count: number, tickets: any[] }[] = [];
    const completedByCreator: { name: string, count: number, tickets: any[] }[] = [];

    const addTicket = (arr: { name: string, count: number, tickets: any[] }[], ticket: any) => {
      let found = arr.find(x => x.name === ticket.creator);
      if (found) {
        found.count++;
        found.tickets.push({ id: ticket.id, ticket_id: ticket.ticket_id });
      } else {
        arr.push({ name: ticket.creator, count: 1, tickets: [{ id: ticket.id, ticket_id: ticket.ticket_id }] });
      }
    };

    uniqueTickets.forEach(t => {
       addTicket(ticketsByCreator, t);
       if (t.status === 'Completed' || t.status === 'Confirmed Finished') {
         addTicket(completedByCreator, t);
       } else if (t.status === 'In Progress') {
         addTicket(inProgressByCreator, t);
       } else {
         addTicket(pendingByCreator, t);
       }
    });

    ticketsByCreator.sort((a,b) => b.count - a.count);
    inProgressByCreator.sort((a,b) => b.count - a.count);
    pendingByCreator.sort((a,b) => b.count - a.count);
    completedByCreator.sort((a,b) => b.count - a.count);

    // 3. Total Active Tasks
    const qbTasks = buildBaseQb('wt')
      .leftJoin('wt.milestones', 'milestones')
      .leftJoin('milestones.tasks', 'tasks')
      .andWhere('tasks.status = :taskStatus', { taskStatus: 'In Progress' })
      .select('COUNT(DISTINCT tasks.id)', 'count');
    const tasksCountRaw = await qbTasks.getRawOne();
    const totalActiveTasks = Number(tasksCountRaw?.count || 0);

    return {
      totalTickets,
      completedTickets,
      inProgressTickets,
      pendingTickets,
      totalTicketsList,
      completedTicketsList,
      inProgressTicketsList,
      pendingTicketsList,
      ticketsByCreator,
      inProgressByCreator,
      pendingByCreator,
      completedByCreator,
      totalActiveTasks
    };
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

  async getMyTaskNames(userId: number): Promise<string[]> {
    const qb = this.taskRepo.createQueryBuilder('task')
      .select('DISTINCT task.name', 'name')
      .leftJoin('task.assigned_multiple', 'assigned_multiple_filter')
      .leftJoin('task.milestone', 'milestone')
      .leftJoin('milestone.workload_ticket', 'workload_ticket')
      .where('(task.assigned_to = :userId OR assigned_multiple_filter.id = :userId)', { userId })
      .andWhere('workload_ticket.is_template = false')
      .orderBy('name', 'ASC');

    const result = await qb.getRawMany();
    return result.map(r => r.name).filter(Boolean);
  }

  async getMyTasks(userId: number, query: any = {}): Promise<{ data: WorkloadTask[], total: number }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const search = query.search || '';
    const taskName = query.taskName || '';

    const qb = this.taskRepo.createQueryBuilder('task')
      .leftJoinAndSelect('task.milestone', 'milestone')
      .leftJoinAndSelect('milestone.workload_ticket', 'workload_ticket')
      .leftJoinAndSelect('workload_ticket.purchase_orders', 'purchase_orders')
      .leftJoinAndSelect('workload_ticket.site', 'site')
      .leftJoinAndSelect('task.evidence_file', 'evidence_file')
      .leftJoinAndSelect('task.attachments', 'attachments')
      .leftJoinAndSelect('attachments.file', 'att_file')
      .leftJoinAndSelect('task.assigned_multiple', 'assigned_multiple')
      .leftJoin('task.assigned_multiple', 'assigned_multiple_filter')
      .where('(task.assigned_to = :userId OR assigned_multiple_filter.id = :userId)', { userId })
      .andWhere('workload_ticket.is_template = false')
      .orderBy('task.created_at', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('workload_ticket.ticket_id ILIKE :search', { search: `%${search}%` });
    }

    if (taskName) {
      qb.andWhere('task.name = :taskName', { taskName });
    }

    const [data, total] = await qb.getManyAndCount();

    // Inject the previous task for Pending tasks
    for (const task of data) {
      if (task.status === 'Pending' && task.milestone?.workload_ticket_id) {
        const prevTask = await this.taskRepo.createQueryBuilder('ptask')
          .leftJoinAndSelect('ptask.assigned_to_user', 'user')
          .leftJoinAndSelect('ptask.assigned_multiple', 'p_assigned_multiple')
          .leftJoin('ptask.milestone', 'pmilestone')
          .where('pmilestone.workload_ticket_id = :ticketId', { ticketId: task.milestone.workload_ticket_id })
          .andWhere('(pmilestone.order_index < :mIndex OR (pmilestone.order_index = :mIndex AND ptask.task_order_index < :tIndex))', {
            mIndex: task.milestone.order_index,
            tIndex: task.task_order_index
          })
          .orderBy('pmilestone.order_index', 'DESC')
          .addOrderBy('ptask.task_order_index', 'DESC')
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
      .leftJoin('task.milestone', 'milestone')
      .leftJoin('milestone.workload_ticket', 'workload_ticket')
      .where('task.name IS NOT NULL')
      .andWhere('workload_ticket.is_template = false')
      .orderBy('task.name', 'ASC')
      .getRawMany();
    return results.map(r => r.name);
  }

  async findOne(id: number): Promise<WorkloadTicket> {
    const ticket = await this.ticketRepo.createQueryBuilder('wt')
      .leftJoinAndSelect('wt.site', 'site')
      .leftJoinAndSelect('wt.purchase_orders', 'purchase_orders')
      .leftJoinAndSelect('purchase_orders.customer', 'customer')
      .leftJoinAndSelect('wt.milestones', 'milestones')
      .leftJoinAndSelect('milestones.tasks', 'tasks')
      .leftJoinAndSelect('tasks.assigned_to_user', 'assigned_to_user')
      .leftJoinAndSelect('tasks.evidence_file', 'evidence_file')
      .leftJoinAndSelect('tasks.attachments', 'attachments')
      .leftJoinAndSelect('attachments.file', 'att_file')
      .leftJoinAndSelect('tasks.assigned_multiple', 'assigned_multiple')
      .where('wt.id = :id', { id })
      .getOne();
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

  async deleteWholeTicket(id: number): Promise<void> {
    const ticket = await this.ticketRepo.findOne(id, {
      relations: ['purchase_orders', 'milestones', 'milestones.tasks', 'milestones.tasks.attachments']
    });
    if (!ticket) throw failedResponse(HttpStatus.NOT_FOUND, 'Ticket not found');

    // 1. Unlink POs
    if (ticket.purchase_orders && ticket.purchase_orders.length > 0) {
      for (const po of ticket.purchase_orders) {
        po.workload_ticket_id = null;
        await this.poRepo.save(po);
      }
    }

    // 2. Delete child data
    if (ticket.milestones) {
      for (const m of ticket.milestones) {
        if (m.tasks) {
          for (const t of m.tasks) {
            if (t.attachments) {
              await this.attachmentRepo.remove(t.attachments);
            }
            await this.taskRepo.remove(t);
          }
        }
        await this.milestoneRepo.remove(m);
      }
    }

    // 3. Delete ticket
    await this.ticketRepo.remove(ticket);
  }

  async addMilestone(ticketId: number, name: string): Promise<Milestone> {
    const ticket = await this.ticketRepo.findOne(ticketId, { relations: ['milestones'] });
    if (!ticket) throw failedResponse(HttpStatus.NOT_FOUND, 'Ticket not found');

    const count = ticket.milestones ? ticket.milestones.length : 0;
    
    let isAllPreviousCompleted = true;
    if (ticket.milestones) {
      for (const m of ticket.milestones) {
        if (m.status !== 'Completed' && m.status !== 'Confirmed Finished') {
          isAllPreviousCompleted = false;
          break;
        }
      }
    }

    const milestone = this.milestoneRepo.create({
      workload_ticket_id: ticketId,
      name,
      order_index: count + 1,
      status: isAllPreviousCompleted ? 'Active' : 'Pending',
    });
    
    const savedMilestone = await this.milestoneRepo.save(milestone);

    if (ticket.status === 'Completed' || ticket.status === 'Confirmed Finished') {
      ticket.status = 'In Progress';
      await this.ticketRepo.save(ticket);
    }

    return savedMilestone;
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

  async getMilestoneTasks(milestoneId: number): Promise<WorkloadTask[]> {
    return this.taskRepo.find({
      where: { milestone_id: milestoneId },
      order: { task_order_index: 'ASC' },
      relations: ['assigned_to_user', 'assigned_multiple']
    });
  }

  async confirmMilestoneFinished(id: number): Promise<Milestone> {
    const milestone = await this.milestoneRepo.findOne(id, { relations: ['workload_ticket'] });
    if (!milestone) throw failedResponse(HttpStatus.NOT_FOUND, 'Milestone not found');
    if (milestone.status !== 'Completed') {
        throw failedResponse(HttpStatus.BAD_REQUEST, 'Milestone must be Completed to be confirmed.');
    }
    
    milestone.status = 'Confirmed Finished';
    
    // Check if there are next milestones, if not mark the ticket as Completed if it wasn't already.
    // However, the next milestone logic is typically handled in handleNextTaskNotification.
    // If we mark it Confirmed Finished, the cron job stops reminding about it.
    
    return await this.milestoneRepo.save(milestone);
  }

  async confirmTicketFinished(id: number): Promise<WorkloadTicket> {
    const ticket = await this.ticketRepo.findOne(id);
    if (!ticket) throw failedResponse(HttpStatus.NOT_FOUND, 'Ticket not found');
    if (ticket.status !== 'Completed') {
        throw failedResponse(HttpStatus.BAD_REQUEST, 'Ticket must be Completed to be confirmed.');
    }
    
    ticket.status = 'Confirmed Finished';
    
    return await this.ticketRepo.save(ticket);
  }

  async deleteMilestone(id: number): Promise<void> {
    const m = await this.milestoneRepo.findOne(id, { relations: ['tasks'] });
    if (!m) return;
    
    if (m.tasks && m.tasks.length > 0) {
      const taskIds = m.tasks.map(t => t.id);
      await this.attachmentRepo.delete({ task_id: In(taskIds) });
      // Delete tasks
      await this.taskRepo.delete({ milestone_id: m.id });
    }
    
    await this.milestoneRepo.delete(id);
  }

  async addTask(milestoneId: number, payload: any): Promise<WorkloadTask> {
    const milestone = await this.milestoneRepo.findOne(milestoneId, { relations: ['tasks', 'workload_ticket', 'workload_ticket.site'] });
    if (!milestone) throw failedResponse(HttpStatus.NOT_FOUND, 'Milestone not found');

    const count = milestone.tasks ? milestone.tasks.length : 0;
    
    let isAllPreviousCompleted = true;
    if (milestone.tasks) {
      for (const t of milestone.tasks) {
        if (t.status !== 'Completed') {
          isAllPreviousCompleted = false;
          break;
        }
      }
    }

    const isFirstActiveTask = (count === 0 && milestone.status === 'Active') || (count > 0 && isAllPreviousCompleted && (milestone.status === 'Completed' || milestone.status === 'Active'));

    const assignedIds = Array.isArray(payload.assigned_to) ? payload.assigned_to : [payload.assigned_to];
    const primaryId = assignedIds[0] || null;

    const task = this.taskRepo.create({
      milestone_id: milestoneId,
      name: payload.name,
      assigned_to: primaryId,
      deadline: payload.deadline,
      status: isFirstActiveTask ? 'In Progress' : 'Pending',
      task_order_index: count + 1,
    });
    let savedTask = await this.taskRepo.save(task);

    if (milestone.status === 'Completed' || milestone.status === 'Confirmed Finished') {
      milestone.status = 'Active';
      await this.milestoneRepo.save(milestone);
    }

    if (milestone.workload_ticket && (milestone.workload_ticket.status === 'Completed' || milestone.workload_ticket.status === 'Confirmed Finished')) {
      milestone.workload_ticket.status = 'In Progress';
      await this.ticketRepo.save(milestone.workload_ticket);
    }

    let users = [];
    if (assignedIds.length > 0) {
      users = await getManager().getRepository(User).findByIds(assignedIds);
      savedTask.assigned_multiple = users;
      savedTask = await this.taskRepo.save(savedTask);
    }

    // Stamp in_progress_at if this task immediately becomes In Progress (first task in active milestone)
    if (isFirstActiveTask) {
      savedTask.in_progress_at = new Date();
      await this.taskRepo.save(savedTask);

      const siteText = milestone.workload_ticket?.site ? ` di Site ${milestone.workload_ticket.site.name} (${milestone.workload_ticket.site.code})` : '';
      const deadlineText = savedTask.deadline ? ` sebelum ${moment(savedTask.deadline).format('DD-MM-YYYY')}` : '';
      
      const allNames = users.map(u => u.name).join(', ');
      const linkText = milestone.workload_ticket?.ticket_id ? `\n\n🔗 Link: https://smarteye.ptbiosron.com/my-tasks?search=${milestone.workload_ticket.ticket_id}` : '';
      for (const user of users) {
        if (user.phone) {
          await this.sendWhatsappNotification(user.phone, `Hai ${allNames}! segera selesaikan Tugas anda: ${savedTask.name}${siteText}${deadlineText}.\nJika Pending Bukan di kamu *segera update di my task agar KPI mu tetap terjaga*${linkText}`);
        }
      }
    }

    return savedTask;
  }

  async addPredecessorTask(taskId: number, payload: any): Promise<WorkloadTask> {
    const currentTask = await this.taskRepo.findOne(taskId, { relations: ['milestone', 'milestone.workload_ticket', 'milestone.workload_ticket.site'] });
    if (!currentTask) throw failedResponse(HttpStatus.NOT_FOUND, 'Task not found');

    // Shift existing tasks in the same milestone down by 1
    await this.taskRepo.createQueryBuilder()
      .update(WorkloadTask)
      .set({ task_order_index: () => 'task_order_index + 1' })
      .where('milestone_id = :milestoneId AND task_order_index >= :orderIndex', {
        milestoneId: currentTask.milestone_id,
        orderIndex: currentTask.task_order_index,
      })
      .execute();

    // Create the new predecessor task in the opened spot
    const task = this.taskRepo.create({
      milestone_id: currentTask.milestone_id,
      name: payload.name,
      assigned_to: payload.assigned_to,
      deadline: payload.deadline,
      status: 'In Progress', // Predecessors are immediately active blocking the current task
      in_progress_at: new Date(),
      task_order_index: currentTask.task_order_index,
    });
    const savedTask = await this.taskRepo.save(task);

    // Revert current task back to Pending
    currentTask.status = 'Pending';
    currentTask.task_order_index = currentTask.task_order_index + 1;
    await this.taskRepo.save(currentTask);

    // Notify the newly assigned user
    const user = await getManager().getRepository(User).findOne(payload.assigned_to);
    if (user && user.phone) {
      const siteText = currentTask.milestone?.workload_ticket?.site ? ` di Site ${currentTask.milestone.workload_ticket.site.name} (${currentTask.milestone.workload_ticket.site.code})` : '';
      const deadlineText = savedTask.deadline ? ` sebelum ${moment(savedTask.deadline).format('DD-MM-YYYY')}` : '';
      const linkText = currentTask.milestone?.workload_ticket?.ticket_id ? `\n\n🔗 Link: https://smarteye.ptbiosron.com/my-tasks?search=${currentTask.milestone.workload_ticket.ticket_id}` : '';
      await this.sendWhatsappNotification(user.phone, `Hai ${user.name}! segera selesaikan Tugas anda: ${savedTask.name}${siteText}${deadlineText}.${linkText}`);
    }

    return savedTask;
  }

  async deleteTask(id: number): Promise<void> {
    const taskToDelete = await this.taskRepo.findOne(id);
    if (!taskToDelete) return;

    await this.taskRepo.delete(id);

    // Close the gap in sequence
    await this.taskRepo.createQueryBuilder()
      .update(WorkloadTask)
      .set({ task_order_index: () => 'task_order_index - 1' })
      .where('milestone_id = :milestoneId AND task_order_index > :orderIndex', {
        milestoneId: taskToDelete.milestone_id,
        orderIndex: taskToDelete.task_order_index,
      })
      .execute();

    // If the deleted task was currently active, the next task in line must take its place
    if (taskToDelete.status === 'In Progress') {
      // We pass a pseudo-task to leverage the existing progression logic.
      // It looks for currentTask.task_order_index + 1, so we pass index - 1.
      await this.handleNextTaskNotification({
        milestone_id: taskToDelete.milestone_id,
        task_order_index: taskToDelete.task_order_index - 1
      } as WorkloadTask);
    }
  }

  async updateTaskAssignee(taskId: number, userId: number): Promise<WorkloadTask> {
    const task = await this.taskRepo.findOne(taskId, { relations: ['assigned_to_user', 'milestone', 'milestone.workload_ticket', 'milestone.workload_ticket.site'] });
    if (!task) throw failedResponse(HttpStatus.NOT_FOUND, 'Task not found');

    if (task.assigned_to === userId) return task; // no change

    const now = new Date();
    task.pic_history = task.pic_history || [];

    // Calculate duration only if task was actually In Progress
    let durationHours = 0;
    if (task.in_progress_at) {
      const durationMs = now.getTime() - new Date(task.in_progress_at).getTime();
      durationHours = Math.round(durationMs / (1000 * 60 * 60));
    }

    const historyItem = {
      user_id: task.assigned_to,
      name: task.assigned_to_user?.name || 'Unassigned',
      assigned_at: task.in_progress_at || null, // Null if it was never in progress
      removed_at: now,
      duration_hours: durationHours
    };

    task.pic_history.push(historyItem);
    task.assigned_to = userId;

    const newUser = await getManager().getRepository(User).findOne(userId);
    task.assigned_to_user = newUser;
    
    // Clear old multiple PICs and set to the new single PIC so frontend doesn't render stale data
    if (newUser) {
      task.assigned_multiple = [newUser];
    } else {
      task.assigned_multiple = [];
    }

    // If reassigned while In Progress, reset the timer for the new PIC
    if (task.status === 'In Progress') {
      task.in_progress_at = now;
    }

    await this.taskRepo.save(task);

    if (task.status === 'In Progress' && newUser && newUser.phone) {
      const siteText = task.milestone?.workload_ticket?.site ? ` di Site ${task.milestone.workload_ticket.site.name} (${task.milestone.workload_ticket.site.code})` : '';
      const deadlineText = task.deadline ? ` sebelum ${moment(task.deadline).format('DD-MM-YYYY')}` : '';
      const linkText = task.milestone?.workload_ticket?.ticket_id ? `\n\n🔗 Link: https://smarteye.ptbiosron.com/my-tasks?search=${task.milestone.workload_ticket.ticket_id}` : '';
      await this.sendWhatsappNotification(newUser.phone, `Hai ${newUser.name}! segera selesaikan Tugas anda: ${task.name}${siteText}${deadlineText}.\nJika Pending Bukan di kamu *segera update di my task agar KPI mu tetap terjaga*${linkText}`);
    }

    return task;
  }

  async updateTaskStatus(taskId: number, payload: any, userId?: number): Promise<any> {
    const task = await this.taskRepo.findOne(taskId, { relations: ['milestone', 'milestone.workload_ticket', 'milestone.workload_ticket.site', 'assigned_to_user', 'assigned_multiple'] });
    if (!task) throw failedResponse(HttpStatus.NOT_FOUND, 'Task not found');

    if (payload.status === 'Completed' && !payload.evidence_file_id) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'Evidence file is required for Completed status');
    }
    if ((payload.status === 'Issue' || payload.status === 'No Need') && !payload.watermark_notes) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'Watermark notes required for Issue/No Need status');
    }

    const isRevertingToPending = payload.status === 'Pending' && task.status !== 'Pending';

    if (payload.status) task.status = payload.status;
    if (payload.evidence_file_id) task.evidence_file_id = payload.evidence_file_id;
    if (payload.watermark_notes) task.watermark_notes = payload.watermark_notes;

    if (userId && !payload.preserve_owner) {
      if (task.assigned_to !== userId) {
        task.assigned_to = userId;
        task.assigned_to_user = { id: userId } as any;
      }
      task.assigned_multiple = [];
    }

    await this.taskRepo.save(task);

    if (payload.status === 'Completed' || payload.status === 'No Need') {
      await this.handleNextTaskNotification(task);
    } else if (isRevertingToPending) {
      if (payload.pending_reason_task_id) {
        const existingTask = await this.taskRepo.findOne(payload.pending_reason_task_id, {
          relations: ['assigned_to_user', 'milestone', 'milestone.workload_ticket', 'milestone.workload_ticket.site']
        });

        if (existingTask) {
          const oldIndex = existingTask.task_order_index;
          const currentIndex = task.task_order_index;

          if (oldIndex < currentIndex - 1) {
            // Shift tasks between oldIndex (exclusive) and currentIndex (exclusive) DOWN by 1
            await this.taskRepo.createQueryBuilder()
              .update(WorkloadTask)
              .set({ task_order_index: () => 'task_order_index - 1' })
              .where('milestone_id = :milestoneId AND task_order_index > :oldIndex AND task_order_index < :currentIndex', {
                milestoneId: task.milestone_id,
                oldIndex,
                currentIndex
              })
              .execute();

            existingTask.task_order_index = currentIndex - 1;
          } else if (oldIndex > currentIndex) {
            // Shift tasks between currentIndex (inclusive) and oldIndex (exclusive) UP by 1
            await this.taskRepo.createQueryBuilder()
              .update(WorkloadTask)
              .set({ task_order_index: () => 'task_order_index + 1' })
              .where('milestone_id = :milestoneId AND task_order_index >= :currentIndex AND task_order_index < :oldIndex', {
                milestoneId: task.milestone_id,
                currentIndex,
                oldIndex
              })
              .execute();

            existingTask.task_order_index = currentIndex;
            // The current task was shifted to currentIndex + 1
            task.task_order_index = currentIndex + 1;
            await this.taskRepo.save(task);
          }

          existingTask.status = 'In Progress';
          existingTask.in_progress_at = new Date();
          await this.taskRepo.save(existingTask);

          if (existingTask.assigned_to_user && existingTask.assigned_to_user.phone) {
            const site = task.milestone?.workload_ticket?.site;
            const sitePrefix = site ? `${site.code}-${site.name}` : '-';
            const rejecterName = task.assigned_to_user?.name || 'Unknown';
            const linkText = task.milestone?.workload_ticket?.ticket_id ? `\n\n🔗 Link: https://smarteye.ptbiosron.com/my-tasks?search=${task.milestone.workload_ticket.ticket_id}` : '';
            const message = `Tugas Anda (${existingTask.name}) pada (${sitePrefix}) telah di reject oleh ${rejecterName} (Menunggu Task Anda selesai). Harap segera ditindaklanjuti dan hubungi ${rejecterName} untuk detail rejection!!${linkText}`;
            await this.sendWhatsappNotification(existingTask.assigned_to_user.phone, message);
          }
        }
      } else {
        throw failedResponse(HttpStatus.BAD_REQUEST, 'A pending_reason_task_id is required when changing status to Pending');
      }
    }

    if (payload.override_date) {
      await this.taskRepo.query(`UPDATE workload_tasks SET updated_at = $1 WHERE id = $2`, [new Date(payload.override_date), task.id]);
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

  async removeTaskEvidence(taskId: number): Promise<void> {
    const task = await this.taskRepo.findOne(taskId);
    if (!task) throw failedResponse(HttpStatus.NOT_FOUND, 'Task not found');
    
    task.evidence_file_id = null as any;
    await this.taskRepo.save(task);
  }

  private async handleNextTaskNotification(currentTask: WorkloadTask) {
    const currentMilestone = await this.milestoneRepo.findOne(currentTask.milestone_id, { relations: ['workload_ticket', 'workload_ticket.site', 'workload_ticket.created_by_user'] });
    const siteText = currentMilestone.workload_ticket?.site ? ` di Site ${currentMilestone.workload_ticket.site.name} (${currentMilestone.workload_ticket.site.code})` : '';

    const allTasks = await this.taskRepo.find({
      where: { milestone_id: currentTask.milestone_id },
      relations: ['assigned_to_user', 'assigned_multiple']
    });

    const pendingTasks = allTasks.filter(t => t.status === 'Pending').sort((a, b) => a.task_order_index - b.task_order_index);
    const inProgressTasks = allTasks.filter(t => t.status === 'In Progress');
    const hasUnfinishedTasks = allTasks.some(t => t.status !== 'Completed' && t.status !== 'No Need');

    if (hasUnfinishedTasks) {
      if (inProgressTasks.length === 0 && pendingTasks.length > 0) {
        const nextTask = pendingTasks[0];
        nextTask.status = 'In Progress';
        nextTask.in_progress_at = new Date();
        await this.taskRepo.save(nextTask);

        const usersToNotify = [];
        if (nextTask.assigned_to_user) usersToNotify.push(nextTask.assigned_to_user);
        if (nextTask.assigned_multiple) {
          nextTask.assigned_multiple.forEach(u => {
            if (!usersToNotify.find(existing => existing.id === u.id)) usersToNotify.push(u);
          });
        }

        const allNames = usersToNotify.map(u => u.name).join(', ');
        const linkText = currentMilestone.workload_ticket?.ticket_id ? `\n\n🔗 Link: https://smarteye.ptbiosron.com/my-tasks?search=${currentMilestone.workload_ticket.ticket_id}` : '';
        for (const u of usersToNotify) {
          if (u.phone) {
            const deadlineText = nextTask.deadline ? ` sebelum ${moment(nextTask.deadline).format('DD-MM-YYYY')}` : '';
            await this.sendWhatsappNotification(u.phone, `Hai ${allNames}! segera selesaikan Tugas anda: ${nextTask.name}${siteText}${deadlineText}.\nJika Pending Bukan di kamu *segera update di my task agar KPI mu tetap terjaga*${linkText}`);
          }
        }
      }
      return;
    }

    currentMilestone.status = 'Completed';
    await this.milestoneRepo.save(currentMilestone);

      // Notify the creator that this milestone is completed
      const creator = currentMilestone.workload_ticket?.created_by_user;
      if (creator && creator.phone) {
        const ticketName = currentMilestone.workload_ticket?.ticket_id || 'Unknown';
        const milestoneName = currentMilestone.name || 'Unknown';
        const linkText = currentMilestone.workload_ticket_id ? `\n\n🔗 Link: https://smarteye.ptbiosron.com/workload-tickets/${currentMilestone.workload_ticket_id}` : '';
        const msg = `Hai ${creator.name} Milestone *${milestoneName}* di workload ticket kamu *${ticketName}* sudah selesai dikerjakan. Aku akan teruskan ini ke team ESAR. pastikan beneran udah bisa ditagih ya, kalau tidak harap tambahkan task baru di milestone nya, Jika memang sudah selesai masuk ke Workload tikect detail dan tekan *CONFIRM FINISH* pada milestone *${milestoneName}*${linkText}`;
        await this.sendWhatsappNotification(creator.phone, msg);
      }

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
          relations: ['assigned_to_user', 'assigned_multiple']
        });
        if (firstTask) {
          if (firstTask.status === 'Pending') {
            firstTask.status = 'In Progress';
            await this.taskRepo.save(firstTask);

            const usersToNotify2 = [];
            if (firstTask.assigned_to_user) usersToNotify2.push(firstTask.assigned_to_user);
            if (firstTask.assigned_multiple) {
              firstTask.assigned_multiple.forEach(u => {
                if (!usersToNotify2.find(existing => existing.id === u.id)) usersToNotify2.push(u);
              });
            }

            const allNames2 = usersToNotify2.map(u => u.name).join(', ');
            const linkText = nextMilestone.workload_ticket?.ticket_id ? `\n\n🔗 Link: https://smarteye.ptbiosron.com/my-tasks?search=${nextMilestone.workload_ticket.ticket_id}` : '';
            for (const u of usersToNotify2) {
              if (u.phone) {
                const deadlineText = firstTask.deadline ? ` sebelum ${moment(firstTask.deadline).format('DD-MM-YYYY')}` : '';
                await this.sendWhatsappNotification(u.phone, `Hai ${allNames2}! Milestone baru dimulai. segera selesaikan Tugas anda: ${firstTask.name}${siteText}${deadlineText}.\nJika Pending Bukan di kamu *segera update di my task agar KPI mu tetap terjaga*${linkText}`);
              }
            }
          }
        }
      } else {
        await getManager().update(WorkloadTicket, currentMilestone.workload_ticket_id, { status: 'Completed' });
      }
  }

  async getEmployeeKpi(from: Date, to: Date): Promise<any[]> {
    // Get all tasks whose in_progress_at falls in the range
    const tasks = await this.taskRepo.createQueryBuilder('task')
      .leftJoinAndSelect('task.assigned_to_user', 'user')
      .leftJoinAndSelect('user.employeePosition', 'position')
      .leftJoinAndSelect('task.assigned_multiple', 'multi_user')
      .leftJoinAndSelect('multi_user.employeePosition', 'multi_position')
      .leftJoinAndSelect('task.milestone', 'milestone')
      .leftJoinAndSelect('milestone.workload_ticket', 'ticket')
      .leftJoinAndSelect('ticket.site', 'site')
      .where(
        `COALESCE(task.in_progress_at, task.created_at) >= :from AND COALESCE(task.in_progress_at, task.created_at) <= :to`,
        { from, to }
      )
      .andWhere('ticket.is_template = false')
      .getMany();

    // Group by user
    const userMap: Record<number, any> = {};
    const now = new Date();

    for (const task of tasks) {
      const usersMapForTask = new Map<number, any>();
      if (task.assigned_to_user) {
        usersMapForTask.set(task.assigned_to_user.id, task.assigned_to_user);
      }
      if (task.assigned_multiple && Array.isArray(task.assigned_multiple)) {
        for (const mu of task.assigned_multiple) {
          usersMapForTask.set(mu.id, mu);
        }
      }

      const users = Array.from(usersMapForTask.values());
      if (users.length === 0) continue;

      for (const user of users) {
        if (!userMap[user.id]) {
          userMap[user.id] = {
            user_id: user.id,
            name: user.name,
            position: (user as any).employeePosition?.name || '-',
            total_assigned: 0,
            completed: 0,
            in_progress: 0,
            pending: 0,
            issue: 0,
            no_need: 0,
            overdue: 0,
            on_time: 0,
            rejection_count: 0,
            total_aging_hours: 0,
            aging_count: 0,
            tasks: [], // Store simplified task list for frontend modal
          };
        }

        const entry = userMap[user.id];
        entry.total_assigned++;

        let isOverdue = false;
        if (['In Progress', 'Pending', 'Issue'].includes(task.status) && task.deadline && task.deadline < now) {
          entry.overdue++;
          isOverdue = true;
        }

        // Add task detail for drill-down
        entry.tasks.push({
          id: task.id,
          name: task.name,
          status: task.status,
          deadline: task.deadline,
          is_overdue: isOverdue,
          site_code: task.milestone?.workload_ticket?.site?.code || '-',
          site_name: task.milestone?.workload_ticket?.site?.name || 'Unknown Site',
          ticket_id: task.milestone?.workload_ticket?.id,
          in_progress_at: task.in_progress_at || task.created_at,
          updated_at: task.updated_at,
        });

        if (task.status === 'Completed') {
          entry.completed++;
          // On-time: completed before or on deadline
          if (task.deadline && task.updated_at <= task.deadline) entry.on_time++;
        } else if (task.status === 'In Progress') {
          entry.in_progress++;
        } else if (task.status === 'Pending') {
          entry.pending++;
        } else if (task.status === 'Issue') {
          entry.issue++;
        } else if (task.status === 'No Need') {
          entry.no_need++;
        }

        // Aging: hours between in_progress_at and completion (or now if still active)
        const startTime = task.in_progress_at || task.created_at;
        if (startTime) {
          const endTime = task.status === 'Completed' ? task.updated_at : now;
          const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          entry.total_aging_hours += hours;
          entry.aging_count++;
        }

        // Rejection count: count pic_history entries where this user appears as a previous holder
        if (task.pic_history && Array.isArray(task.pic_history)) {
          for (const h of task.pic_history) {
            if (h.user_id === user.id) entry.rejection_count++;
          }
        }
      }
    }

    // Calculate derived metrics
    return Object.values(userMap).map((e: any) => ({
      ...e,
      completion_rate: e.total_assigned > 0 ? Math.round((e.completed / e.total_assigned) * 100 * 10) / 10 : 0,
      on_time_rate: e.completed > 0 ? Math.round((e.on_time / e.completed) * 100 * 10) / 10 : 0,
      avg_aging_hours: e.aging_count > 0 ? Math.round((e.total_aging_hours / e.aging_count) * 10) / 10 : 0,
    })).sort((a, b) => b.completion_rate - a.completion_rate);
  }

  async copyMilestones(targetTicketId: number, sourceTicketId: number): Promise<void> {
    const targetTicket = await this.ticketRepo.findOne(targetTicketId);
    if (!targetTicket) throw failedResponse(HttpStatus.NOT_FOUND, 'Target ticket not found');

    const sourceTicket = await this.ticketRepo.findOne(sourceTicketId, {
      relations: ['milestones', 'milestones.tasks', 'milestones.tasks.assigned_multiple'],
    });
    if (!sourceTicket) throw failedResponse(HttpStatus.NOT_FOUND, 'Source ticket not found');
    if (!sourceTicket.milestones || sourceTicket.milestones.length === 0) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'Source ticket has no milestones to copy');
    }

    // Sort source milestones by their original creation/id to preserve order conceptually
    sourceTicket.milestones.sort((a, b) => a.id - b.id);

    let nextMilestoneOrderIndex = await this.milestoneRepo.count({ where: { workload_ticket_id: targetTicketId } });

    const newDeadline = moment().add(7, 'days').toDate();

    for (const sMilestone of sourceTicket.milestones) {
      // Create clone milestone
      const newMilestone = this.milestoneRepo.create({
        workload_ticket_id: targetTicketId,
        name: sMilestone.name,
        status: 'Active',
        order_index: ++nextMilestoneOrderIndex,
      });
      const savedMilestone = await this.milestoneRepo.save(newMilestone);

      if (sMilestone.tasks && sMilestone.tasks.length > 0) {
        // Sort tasks by task_order_index to preserve order
        sMilestone.tasks.sort((a, b) => (a.task_order_index || 0) - (b.task_order_index || 0));

        let taskIndex = 1;
        for (const sTask of sMilestone.tasks) {
          const newTask = this.taskRepo.create({
            milestone_id: savedMilestone.id,
            name: sTask.name,
            assigned_to: sTask.assigned_to,
            status: 'In Progress', // Force all to In Progress, dropping previous_task_id
            task_order_index: taskIndex++,
            deadline: newDeadline,
            in_progress_at: new Date()
          });

          let savedTask = await this.taskRepo.save(newTask);

          if (sTask.assigned_multiple && sTask.assigned_multiple.length > 0) {
            savedTask.assigned_multiple = sTask.assigned_multiple;
            await this.taskRepo.save(savedTask);
          }
        }
      }
    }

    // Rollback target ticket to In Progress if it was completed
    if (targetTicket.status === 'Completed' || targetTicket.status === 'Confirmed Finished') {
      targetTicket.status = 'In Progress';
      await this.ticketRepo.save(targetTicket);
    }
  }

  async getDailyProgressReport(date: Date): Promise<any> {
    // We want the start of the day and end of the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Fetch Absences for these users on the given date (Fetch ALL for today first)
    const absences = await this.absenceRepo.createQueryBuilder('absence')
      .where('absence.clock_in >= :start AND absence.clock_in <= :end', { start: startOfDay, end: endOfDay })
      .getMany();

    const userIdsWithAbsence = absences.map(a => a.user_id);

    // 2. Fetch Target Users (Internal + External with absence)
    const query = getManager().getRepository(User).createQueryBuilder('user')
      .leftJoinAndSelect('user.employeePosition', 'position')
      .where('(LOWER(user.status_description) = :onboard1 OR LOWER(user.status_description) = :onboard2)', { onboard1: 'on board', onboard2: 'on bord' });

    if (userIdsWithAbsence.length > 0) {
      query.andWhere(new Brackets(qb => {
        qb.where('LOWER(user.level_iresource) = :internal', { internal: 'internal' })
          .orWhere('(LOWER(user.level_iresource) = :external AND user.id IN (:...userIdsWithAbsence))', { external: 'external', userIdsWithAbsence });
      }));
    } else {
      query.andWhere('LOWER(user.level_iresource) = :internal', { internal: 'internal' });
    }

    const users = await query.getMany();

    if (!users || users.length === 0) {
      return { total_users: 0, total_present: 0, external_present: 0, on_time: 0, late: 0, total_tasks_completed: 0, users: [] };
    }

    const userIds = users.map(u => u.id);

    const absenceMap = new Map<number, any>();
    absences.forEach(a => absenceMap.set(a.user_id, a));

    // 3. Fetch Workload Tasks that were active/completed on this date for these users
    // A task is relevant if it was completed today, or if it is currently assigned to the user and is In Progress/Pending/Issue/No Need
    const tasks = await this.taskRepo.createQueryBuilder('task')
      .leftJoinAndSelect('task.assigned_to_user', 'user')
      .leftJoinAndSelect('task.assigned_multiple', 'multi_user')
      .leftJoinAndSelect('task.milestone', 'milestone')
      .leftJoinAndSelect('milestone.workload_ticket', 'ticket')
      .leftJoinAndSelect('ticket.site', 'site')
      .where(
        `((task.status = 'Completed' AND task.updated_at >= :start AND task.updated_at <= :end) OR
          (task.status IN ('In Progress', 'Pending', 'Issue', 'No Need')))`,
        { start: startOfDay, end: endOfDay }
      )
      .andWhere('ticket.is_template = false')
      .getMany();

    // Map Tasks to Users
    const userTasksMap = new Map<number, any[]>();
    for (const task of tasks) {
      const assignedUsers = new Set<number>();
      if (task.assigned_to_user) assignedUsers.add(task.assigned_to_user.id);
      if (task.assigned_multiple) {
        task.assigned_multiple.forEach((mu: any) => assignedUsers.add(mu.id));
      }

      assignedUsers.forEach(uid => {
        if (!userTasksMap.has(uid)) userTasksMap.set(uid, []);
        userTasksMap.get(uid).push(task);
      });
    }

    // 3.5 Fetch Live Distance Tracking for these users on the given date
    const dateString = moment(date).format('YYYY-MM-DD');
    const trackings = await this.distanceTrackingRepo.createQueryBuilder('dt')
      .where('dt.user_id IN (:...userIds)', { userIds })
      .andWhere('dt.date = :dateString', { dateString })
      .orderBy('dt.end_trip_time', 'DESC')
      .getMany();

    // Map the most recent tracking to each user
    const trackingMap = new Map<number, DistanceTracking>();
    trackings.forEach(t => {
      // Because it's ordered by DESC, the first one we see is the latest for that user if we haven't set it yet
      if (!trackingMap.has(t.userId)) {
        trackingMap.set(t.userId, t);
      }
    });

    // 4. Merge and format data
    let totalUsers = 0;
    let totalPresent = 0;
    let externalPresent = 0;
    let onTime = 0;
    let late = 0;
    let totalTasksCompleted = 0;

    const formattedUsers = users.map(user => {
      const isInternal = user.level_iresource?.toLowerCase() === 'internal';
      if (isInternal) {
        totalUsers++;
      }

      const absence = absenceMap.get(user.id);
      const userTasks = userTasksMap.get(user.id) || [];
      const tracking = trackingMap.get(user.id);

      let isPresent = false;
      let isLate = false;
      let clockInTime = null;
      let clockOutTime = null;

      if (absence) {
        isPresent = true;
        if (isInternal) {
          totalPresent++;
        } else {
          externalPresent++;
        }
        clockInTime = absence.clock_in;
        clockOutTime = absence.clock_out;
        if (absence.late_reason) {
          isLate = true;
          late++;
        } else {
          onTime++;
        }
      }

      let completedTasksCount = 0;
      let unfinishedTasksCount = 0;

      userTasks.forEach(t => {
        if (t.status === 'Completed' && new Date(t.updated_at) >= startOfDay && new Date(t.updated_at) <= endOfDay) {
          completedTasksCount++;
          totalTasksCompleted++;
        } else if (['In Progress', 'Pending', 'Issue'].includes(t.status)) {
          unfinishedTasksCount++;
        }
      });

      // We intentionally return all targeted users (including absent ones) so the frontend can display 'Not Yet Present' statistics.

      let finalLiveLat = tracking?.endLat || null;
      let finalLiveLng = tracking?.endLng || null;
      let finalLiveTime = tracking?.endTripTime || null;

      if (user.live_updated_at && user.live_lat && user.live_lng) {
        const liveUserTime = new Date(user.live_updated_at).getTime();
        const trackingTime = finalLiveTime ? Number(finalLiveTime) : 0;
        
        if (!finalLiveTime || liveUserTime > trackingTime) {
          finalLiveLat = user.live_lat;
          finalLiveLng = user.live_lng;
          finalLiveTime = liveUserTime;
        }
      }

      const displayName = isInternal ? user.name : `${user.name} (External)`;

      return {
        id: user.id,
        name: displayName,
        position: user.employeePosition?.name || '-',
        is_present: isPresent,
        is_late: isLate,
        clock_in: clockInTime,
        clock_out: clockOutTime,
        late_reason: absence?.late_reason || null,
        clock_in_latitude: absence?.clock_in_latitude || null,
        clock_in_longitude: absence?.clock_in_longitude || null,
        clock_out_latitude: absence?.clock_out_latitude || null,
        clock_out_longitude: absence?.clock_out_longitude || null,
        live_lat: finalLiveLat,
        live_lng: finalLiveLng,
        live_time: finalLiveTime,
        activity_plan: absence?.activity_plan || null,
        activity_result: absence?.activity_result || null,
        completed_tasks_count: completedTasksCount,
        unfinished_tasks_count: unfinishedTasksCount,
        is_internal: isInternal,
        tasks: userTasks.map(t => ({
          id: t.id,
          name: t.name,
          status: t.status,
          site_code: t.milestone?.workload_ticket?.site?.code || '-',
          ticket_id: t.milestone?.workload_ticket?.ticket_id || '-',
          updated_at: t.updated_at
        }))
      };
    }).filter(u => u !== null);

    return {
      total_users: totalUsers,
      total_present: totalPresent,
      external_present: externalPresent,
      on_time: onTime,
      late: late,
      total_tasks_completed: totalTasksCompleted,
      users: formattedUsers
    };
  }

  async getTrendingTasks(query: any = {}): Promise<any> {
    const period = query.period || 'monthly';
    const taskNames = query.taskNames; // Expecting array or comma-separated string if from GET query

    let truncString = 'month';
    if (period === 'daily') truncString = 'day';
    if (period === 'weekly') truncString = 'week';
    if (period === 'yearly') truncString = 'year';

    const qb = this.taskRepo.createQueryBuilder('task')
      .select(`DATE_TRUNC('${truncString}', task.updated_at)`, 'date')
      .addSelect('COUNT(DISTINCT task.id)', 'count')
      .addSelect('task.name', 'taskName')
      .innerJoin('task.milestone', 'milestone')
      .innerJoin('milestone.workload_ticket', 'workload_ticket')
      .leftJoin('workload_ticket.purchase_orders', 'purchase_orders')
      .leftJoin('purchase_orders.customer', 'customer')
      .leftJoin('purchase_orders.project', 'project')
      .where('task.status = :status', { status: 'Completed' })
      .andWhere('workload_ticket.is_template = false')
      .andWhere('task.updated_at IS NOT NULL');

    const startDate = query.startDate;
    const endDate = query.endDate;
    const customerId = query.customer_id;
    const projectId = query.project_id;

    if (customerId) {
      qb.andWhere('customer.id = :customerId', { customerId });
    }

    if (projectId) {
      qb.andWhere('project.id = :projectId', { projectId });
    }

    if (taskNames) {
      const namesArray = Array.isArray(taskNames) ? taskNames : taskNames.split(',');
      if (namesArray.length > 0) {
        qb.andWhere('task.name IN (:...namesArray)', { namesArray });
      }
    }

    if (startDate) {
      qb.andWhere('task.updated_at >= :startDate', { startDate: new Date(startDate) });
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('task.updated_at <= :endDate', { endDate: end });
    }

    qb.groupBy(`DATE_TRUNC('${truncString}', task.updated_at)`)
      .addGroupBy('task.name')
      .orderBy(`DATE_TRUNC('${truncString}', task.updated_at)`, 'ASC');

    const result = await qb.getRawMany();

    return result.map(r => ({
      date: r.date,
      count: Number(r.count),
      taskName: r.taskName
    }));
  }

  private async sendWhatsappNotification(phoneNumber: string, message: string) {
    try {
      await this.whatsappService.sendMessage(phoneNumber, message);
    } catch (e) {
      console.error('Failed to send Whatsapp', e);
    }
  }
}
