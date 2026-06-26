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
  ) { }

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
    const milestone = await this.milestoneRepo.findOne(milestoneId, { relations: ['tasks', 'workload_ticket', 'workload_ticket.site'] });
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

    // Stamp in_progress_at if this task immediately becomes In Progress (first task in active milestone)
    if (isFirstActiveTask) {
      savedTask.in_progress_at = new Date();
      await this.taskRepo.save(savedTask);

      const user = await getManager().getRepository(User).findOne(payload.assigned_to);
      if (user && user.phone) {
        const siteText = milestone.workload_ticket?.site ? ` di Site ${milestone.workload_ticket.site.name} (${milestone.workload_ticket.site.code})` : '';
        const deadlineText = savedTask.deadline ? ` sebelum ${moment(savedTask.deadline).format('DD-MM-YYYY')}` : '';
        await this.sendWhatsappNotification(user.phone, `Hai ${user.name}! segera selesaikan Tugas anda: ${savedTask.name}${siteText}${deadlineText}.`);
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
      await this.sendWhatsappNotification(user.phone, `Hai ${user.name}! segera selesaikan Tugas anda: ${savedTask.name}${siteText}${deadlineText}.`);
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

    // If reassigned while In Progress, reset the timer for the new PIC
    if (task.status === 'In Progress') {
      task.in_progress_at = now;
    }

    const newUser = await getManager().getRepository(User).findOne(userId);
    task.assigned_to_user = newUser;

    await this.taskRepo.save(task);

    if (task.status === 'In Progress' && newUser && newUser.phone) {
      const siteText = task.milestone?.workload_ticket?.site ? ` di Site ${task.milestone.workload_ticket.site.name} (${task.milestone.workload_ticket.site.code})` : '';
      const deadlineText = task.deadline ? ` sebelum ${moment(task.deadline).format('DD-MM-YYYY')}` : '';
      await this.sendWhatsappNotification(newUser.phone, `Hai ${newUser.name}! segera selesaikan Tugas anda: ${task.name}${siteText}${deadlineText}.`);
    }

    return task;
  }

  async updateTaskStatus(taskId: number, payload: any): Promise<any> {
    const task = await this.taskRepo.findOne(taskId, { relations: ['milestone', 'milestone.workload_ticket', 'milestone.workload_ticket.site', 'assigned_to_user'] });
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

    await this.taskRepo.save(task);

    if (payload.status === 'Completed' || payload.status === 'No Need') {
      await this.handleNextTaskNotification(task);
    } else if (isRevertingToPending) {
      // Find the previous task and set it back to In Progress
      const previousTask = await this.taskRepo.findOne({
        where: {
          milestone_id: task.milestone_id,
          task_order_index: task.task_order_index - 1
        },
        relations: ['assigned_to_user', 'milestone', 'milestone.workload_ticket', 'milestone.workload_ticket.site']
      });

      if (previousTask) {
        previousTask.status = 'In Progress';
        previousTask.in_progress_at = new Date();
        await this.taskRepo.save(previousTask);

        // Notify the previous user that the task has been rejected
        if (previousTask.assigned_to_user && previousTask.assigned_to_user.phone) {
          const site = task.milestone?.workload_ticket?.site;
          const sitePrefix = site ? `${site.code}-${site.name}` : '-';
          const rejecterName = task.assigned_to_user?.name || 'Unknown';
          const message = `Tugas Anda (${previousTask.name}) pada (${sitePrefix}) telah di reject oleh ${rejecterName}. Harap segera ditindaklanjuti dan hubungi ${rejecterName} untuk detail rejection!!`;
          await this.sendWhatsappNotification(previousTask.assigned_to_user.phone, message);
        }
      }
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

    const nextTask = await this.taskRepo.findOne({
      where: {
        milestone_id: currentTask.milestone_id,
        task_order_index: currentTask.task_order_index + 1
      },
      relations: ['assigned_to_user']
    });

    if (nextTask) {
      nextTask.status = 'In Progress';
      nextTask.in_progress_at = new Date();
      await this.taskRepo.save(nextTask);
      if (nextTask.assigned_to_user && nextTask.assigned_to_user.phone) {
        const deadlineText = nextTask.deadline ? ` sebelum ${moment(nextTask.deadline).format('DD-MM-YYYY')}` : '';
        await this.sendWhatsappNotification(nextTask.assigned_to_user.phone, `Hai ${nextTask.assigned_to_user.name}! segera selesaikan Tugas anda: ${nextTask.name}${siteText}${deadlineText}.`);
      }
    } else {
      currentMilestone.status = 'Completed';
      await this.milestoneRepo.save(currentMilestone);

      // Notify the creator that this milestone is completed
      const creator = currentMilestone.workload_ticket?.created_by_user;
      if (creator && creator.phone) {
        const ticketName = currentMilestone.workload_ticket?.ticket_id || 'Unknown';
        const milestoneName = currentMilestone.name || 'Unknown';
        const msg = `Hai ${creator.name} workload ticket kamu (${ticketName} - ${milestoneName}) sudah selesai dikerjakan. Aku akan teruskan ini ke team ESAR. pastikan beneran udah bisa ditagih ya, kalau tidak harap tambahkan task baru di milestone nya`;
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
          relations: ['assigned_to_user']
        });
        if (firstTask) {
          firstTask.status = 'In Progress';
          await this.taskRepo.save(firstTask);
          if (firstTask.assigned_to_user && firstTask.assigned_to_user.phone) {
            const deadlineText = firstTask.deadline ? ` sebelum ${moment(firstTask.deadline).format('DD-MM-YYYY')}` : '';
            await this.sendWhatsappNotification(firstTask.assigned_to_user.phone, `Hai ${firstTask.assigned_to_user.name}! Milestone baru dimulai. segera selesaikan Tugas anda: ${firstTask.name}${siteText}${deadlineText}.`);
          }
        }
      } else {
        await getManager().update(WorkloadTicket, currentMilestone.workload_ticket_id, { status: 'Completed' });
      }
    }
  }

  async getEmployeeKpi(from: Date, to: Date): Promise<any[]> {
    // Get all tasks whose in_progress_at falls in the range
    const tasks = await this.taskRepo.createQueryBuilder('task')
      .leftJoinAndSelect('task.assigned_to_user', 'user')
      .leftJoinAndSelect('user.employeePosition', 'position')
      .leftJoinAndSelect('task.milestone', 'milestone')
      .leftJoinAndSelect('milestone.workload_ticket', 'ticket')
      .leftJoinAndSelect('ticket.site', 'site')
      .where(
        `COALESCE(task.in_progress_at, task.created_at) >= :from AND COALESCE(task.in_progress_at, task.created_at) <= :to`,
        { from, to }
      )
      .andWhere('task.assigned_to IS NOT NULL')
      .getMany();

    // Group by user
    const userMap: Record<number, any> = {};
    const now = new Date();

    for (const task of tasks) {
      const user = task.assigned_to_user;
      if (!user) continue;
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

    // Calculate derived metrics
    return Object.values(userMap).map((e: any) => ({
      ...e,
      completion_rate: e.total_assigned > 0 ? Math.round((e.completed / e.total_assigned) * 100 * 10) / 10 : 0,
      on_time_rate: e.completed > 0 ? Math.round((e.on_time / e.completed) * 100 * 10) / 10 : 0,
      avg_aging_hours: e.aging_count > 0 ? Math.round((e.total_aging_hours / e.aging_count) * 10) / 10 : 0,
    })).sort((a, b) => b.completion_rate - a.completion_rate);
  }

  private async sendWhatsappNotification(phoneNumber: string, message: string) {
    try {
      await this.whatsappService.sendMessage(phoneNumber, message);
    } catch (e) {
      console.error('Failed to send Whatsapp', e);
    }
  }
}
