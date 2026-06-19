import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DocumentStorageService } from './document-storage.service';
import { UsersService } from '../users/users.service';

@ApiTags('Document Storage')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'document-storage',
  version: '1',
})
export class DocumentStorageController {
  constructor(
    private readonly documentStorageService: DocumentStorageService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('search') search: string) {
    return this.documentStorageService.findAll({ page: page || 1, limit: limit || 10 }, search);
  }

  @Post()
  create(@Body() body: { title: string; file_url: string }, @Request() request) {
    return this.documentStorageService.create(body.title, body.file_url, request.user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: number, @Request() req) {
    const user = await this.usersService.findOneFull({ id: req.user.id });
    const isSuperAdmin =
      user?.employeePosition?.grant_all_access === true ||
      user?.employee_position_id === 1 ||
      String(user?.employee_position_id) === '1';

    if (!isSuperAdmin) {
      throw new HttpException('Only Super Admin can delete documents', HttpStatus.FORBIDDEN);
    }
    return this.documentStorageService.delete(id);
  }
}
