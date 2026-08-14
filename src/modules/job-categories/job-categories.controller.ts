import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JobCategory } from '../../entities/job-category.entity';
import { UsersService } from '../users/users.service';

@ApiTags('Job Categories')
@Controller({ path: 'job-categories', version: '1' })
export class JobCategoriesController {
  constructor(
    @InjectRepository(JobCategory)
    private readonly categoryRepo: Repository<JobCategory>,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async getAll() {
    return this.categoryRepo.find({ order: { name: 'ASC' } });
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: { name: string }, @Request() req) {
    await this.assertSuperAdmin(req);
    if (!body.name?.trim()) throw new HttpException('Name is required', HttpStatus.BAD_REQUEST);
    const existing = await this.categoryRepo.findOne({ where: { name: body.name.trim() } });
    if (existing) throw new HttpException('Job category already exists', HttpStatus.CONFLICT);
    const category = this.categoryRepo.create({ name: body.name.trim() });
    return this.categoryRepo.save(category);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string, @Request() req) {
    await this.assertSuperAdmin(req);
    const category = await this.categoryRepo.findOne(+id);
    if (!category) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    await this.categoryRepo.remove(category);
    return { success: true };
  }

  private async assertSuperAdmin(req: any) {
    const user = await this.usersService.findOneFull({ id: req.user.id });
    const isSuperAdmin =
      user?.employeePosition?.grant_all_access === true ||
      user?.employee_position_id === 1 ||
      String(user?.employee_position_id) === '1';
    if (!isSuperAdmin) throw new HttpException('Only Super Admin can manage job categories', HttpStatus.FORBIDDEN);
  }
}
