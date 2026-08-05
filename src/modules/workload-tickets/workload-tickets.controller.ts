import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch, Delete, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { successResponse } from 'src/utils/responses';
import { WorkloadTicketsService } from './workload-tickets.service';
import { WorkloadTicketsCronService } from './workload-tickets.cron.service';
import { UsersService } from '../users/users.service';
import { HttpException } from '@nestjs/common';

@ApiBearerAuth()
@ApiTags('Workload Tickets')
@Controller({
  path: 'workload-tickets',
  version: '1',
})
export class WorkloadTicketsController {
  constructor(
    private readonly ticketsService: WorkloadTicketsService,
    private readonly usersService: UsersService,
    private readonly ticketsCronService: WorkloadTicketsCronService,
  ) { }

  @Post('trigger-notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async triggerNotifications(@Request() req) {
    await this.assertSuperAdmin(req);
    // Since we removed the time check from the individual methods, calling them directly will execute them.
    await this.ticketsCronService.handleDailyNotifications();
    await this.ticketsCronService.handleCreatorNotifications();
    return successResponse(null, 'Notifications triggered successfully');
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getTemplates() {
    return successResponse(
      await this.ticketsService.findAllTemplates(),
      'Templates retrieved successfully'
    );
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createTemplate(@Body() body: { name: string }, @Request() req) {
    if (!body.name) {
      throw new HttpException('Template name is required', HttpStatus.BAD_REQUEST);
    }
    return successResponse(
      await this.ticketsService.createTemplate(body.name, req.user.id),
      'Template created successfully'
    );
  }

  @Post('create/:siteId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Param('siteId') siteId: number, @Body() body: { poIds: number[], templateId: number }, @Request() req) {
    if (!body.templateId) {
      throw new HttpException('Template ID is required', HttpStatus.BAD_REQUEST);
    }
    return successResponse(
      await this.ticketsService.create(siteId, req.user.id, body.poIds, body.templateId),
      'Workload ticket created successfully'
    );
  }

  @Post(':id/purchase-orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async addPurchaseOrders(@Param('id') id: string, @Body() body: { poIds: number[] }) {
    await this.ticketsService.addPurchaseOrders(+id, body.poIds);
    return successResponse(null, 'Purchase orders added successfully');
  }

  @Delete(':id/purchase-orders/:poId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async removePurchaseOrder(@Param('id') id: string, @Param('poId') poId: string) {
    await this.ticketsService.removePurchaseOrder(+id, +poId);
    return successResponse(null, 'Purchase order removed successfully');
  }

  @Get('unassigned-pos/:siteId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getUnassignedPos(@Param('siteId') siteId: string) {
    return successResponse(
      await this.ticketsService.getUnassignedPos(+siteId),
      'Success'
    );
  }

  @Get('my-tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getMyTasks(@Request() req, @Query() query: any) {
    const result = await this.ticketsService.getMyTasks(req.user.id, query);
    return {
      statusCode: 200,
      message: 'Success',
      data: result.data,
      total: result.total,
      page: Number(query.page || 1),
      limit: Number(query.limit || 10)
    };
  }

  @Get('my-tasks/names')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getMyTaskNames(@Request() req) {
    const result = await this.ticketsService.getMyTaskNames(req.user.id);
    return successResponse(result, 'Success');
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getSummary(@Query() query: any) {
    const result = await this.ticketsService.getSummary(query);
    return successResponse(result, 'Summary retrieved successfully');
  }

  @Get('trending-tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getTrendingTasks(@Query() query: any) {
    const result = await this.ticketsService.getTrendingTasks(query);
    return successResponse(result, 'Trending tasks retrieved successfully');
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(@Query() query: any) {
    const result = await this.ticketsService.findAll(query);
    return {
      statusCode: 200,
      message: 'Workload Tickets retrieved successfully',
      data: result.data,
      total: result.total,
      page: Number(query.page || 1),
      limit: Number(query.limit || 10)
    };
  }

  @Get('kpi/employees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getEmployeeKpi(@Query('from') from: string, @Query('to') to: string) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    toDate.setHours(23, 59, 59, 999);
    const data = await this.ticketsService.getEmployeeKpi(fromDate, toDate);
    return successResponse(data, 'KPI data retrieved successfully');
  }

  @Get('kpi/daily-progress')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getDailyProgress(@Query('date') dateString: string) {
    const date = dateString ? new Date(dateString) : new Date();
    const data = await this.ticketsService.getDailyProgressReport(date);
    return successResponse(data, 'Daily progress report retrieved successfully');
  }

  @Post('kpi/notify/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async notifyKpiUser(@Param('userId') userId: string) {
    await this.ticketsCronService.handleDailyNotifications(+userId);
    return successResponse(null, 'Notification sent successfully');
  }

  @Get('tasks/unique-names')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getUniqueTaskNames() {
    return successResponse(
      await this.ticketsService.getUniqueTaskNames(),
      'Success'
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param('id') id: string) {
    return successResponse(
      await this.ticketsService.findOne(+id),
      'Success'
    );
  }

  @Post(':id/copy-milestones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async copyMilestones(@Param('id') id: string, @Body() body: { source_ticket_id: number }) {
    await this.ticketsService.copyMilestones(+id, body.source_ticket_id);
    return successResponse(null, 'Milestones successfully copied from template');
  }

  @Post(':id/milestones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async addMilestone(@Param('id') ticketId: string, @Body() body: { name: string }) {
    return successResponse(
      await this.ticketsService.addMilestone(+ticketId, body.name),
      'Milestone added successfully'
    );
  }

  @Patch(':id/milestones/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async reorderMilestones(@Param('id') ticketId: string, @Body() body: { orderIds: number[] }) {
    return successResponse(
      await this.ticketsService.reorderMilestones(+ticketId, body.orderIds),
      'Milestones reordered successfully'
    );
  }

  @Patch('milestones/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async editMilestone(@Param('id') id: string, @Body() body: { name: string }) {
    return successResponse(
      await this.ticketsService.editMilestone(+id, body.name),
      'Milestone updated successfully'
    );
  }

  @Get('milestones/:id/tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getMilestoneTasks(@Param('id') id: string) {
    return successResponse(
      await this.ticketsService.getMilestoneTasks(+id),
      'Success'
    );
  }

  @Patch('milestones/:id/confirm-finish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async confirmMilestoneFinished(@Param('id') id: string) {
    return successResponse(
      await this.ticketsService.confirmMilestoneFinished(+id),
      'Milestone confirmed finished successfully'
    );
  }

  @Patch(':id/confirm-finish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async confirmTicketFinished(@Param('id') id: string) {
    return successResponse(
      await this.ticketsService.confirmTicketFinished(+id),
      'Ticket confirmed finished successfully'
    );
  }

  @Delete('milestones/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deleteMilestone(@Param('id') id: string) {
    await this.ticketsService.deleteMilestone(+id);
    return successResponse(null, 'Milestone deleted successfully');
  }

  @Post('milestones/:milestoneId/tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async addTask(@Param('milestoneId') milestoneId: string, @Body() body: any) {
    return successResponse(
      await this.ticketsService.addTask(+milestoneId, body),
      'Task added successfully'
    );
  }

  @Delete('tasks/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deleteTask(@Param('id') id: string) {
    await this.ticketsService.deleteTask(+id);
    return successResponse(null, 'Task deleted successfully');
  }

  @Post('tasks/:id/predecessor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async addPredecessorTask(@Param('id') taskId: string, @Body() body: any) {
    return successResponse(
      await this.ticketsService.addPredecessorTask(+taskId, body),
      'Predecessor task injected successfully'
    );
  }

  @Patch('tasks/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateTaskStatus(@Param('id') taskId: string, @Body() body: any, @Request() req) {
    return successResponse(
      await this.ticketsService.updateTaskStatus(+taskId, body, req.user.id),
      'Task status updated successfully'
    );
  }

  @Patch('tasks/:id/assignee')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateTaskAssignee(@Param('id') taskId: string, @Body() body: { assigned_to: number }) {
    return successResponse(
      await this.ticketsService.updateTaskAssignee(+taskId, body.assigned_to),
      'Task PIC updated successfully'
    );
  }

  @Post('tasks/:id/attachments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async addTaskAttachment(@Param('id') taskId: string, @Body() body: { fileId: number }) {
    return successResponse(
      await this.ticketsService.addTaskAttachment(+taskId, body.fileId),
      'Attachment added successfully'
    );
  }

  @Delete('tasks/:taskId/attachments/:attachmentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async removeTaskAttachment(@Param('taskId') taskId: string, @Param('attachmentId') attachmentId: string) {
    await this.ticketsService.removeTaskAttachment(+taskId, +attachmentId);
    return successResponse(null, 'Attachment removed successfully');
  }

  @Delete('tasks/:taskId/evidence')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async removeTaskEvidence(@Param('taskId') taskId: string) {
    await this.ticketsService.removeTaskEvidence(+taskId);
    return successResponse(null, 'Evidence file removed successfully');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('id') id: string, @Request() req) {
    await this.assertSuperAdmin(req);
    await this.ticketsService.deleteWholeTicket(+id);
    return successResponse(null, 'Workload ticket deleted successfully');
  }

  private async assertSuperAdmin(req: any) {
    const user = await this.usersService.findOneFull({ id: req.user.id });
    const isSuperAdmin =
      user?.employeePosition?.grant_all_access === true ||
      user?.employee_position_id === 1 ||
      String(user?.employee_position_id) === '1';
    if (!isSuperAdmin) throw new HttpException('Only Super Admin can delete workload tickets', HttpStatus.FORBIDDEN);
  }
}
