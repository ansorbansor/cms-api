import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TaskNamePreset } from '../../entities/task-name-preset.entity';
import { UsersService } from '../users/users.service';

@ApiTags('Task Name Presets')
@Controller({ path: 'task-name-presets', version: '1' })
export class TaskNamePresetsController {
  constructor(
    @InjectRepository(TaskNamePreset)
    private readonly presetRepo: Repository<TaskNamePreset>,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async getAll() {
    return this.presetRepo.find({ order: { name: 'ASC' } });
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: { name: string }, @Request() req) {
    await this.assertSuperAdmin(req);
    if (!body.name?.trim()) throw new HttpException('Name is required', HttpStatus.BAD_REQUEST);
    const existing = await this.presetRepo.findOne({ where: { name: body.name.trim() } });
    if (existing) throw new HttpException('Task name preset already exists', HttpStatus.CONFLICT);
    const preset = this.presetRepo.create({ name: body.name.trim() });
    return this.presetRepo.save(preset);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string, @Request() req) {
    await this.assertSuperAdmin(req);
    const preset = await this.presetRepo.findOne(+id);
    if (!preset) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    await this.presetRepo.remove(preset);
    return { success: true };
  }

  private async assertSuperAdmin(req: any) {
    const user = await this.usersService.findOneFull({ id: req.user.id });
    const isSuperAdmin =
      user?.employeePosition?.grant_all_access === true ||
      user?.employee_position_id === 1 ||
      String(user?.employee_position_id) === '1';
    if (!isSuperAdmin) throw new HttpException('Only Super Admin can manage task name presets', HttpStatus.FORBIDDEN);
  }
}
