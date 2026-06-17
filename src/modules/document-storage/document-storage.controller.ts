import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DocumentStorageService } from './document-storage.service';

@ApiTags('Document Storage')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'document-storage',
  version: '1',
})
export class DocumentStorageController {
  constructor(private readonly documentStorageService: DocumentStorageService) {}

  @Get()
  findAll(@Query('page') page: number, @Query('limit') limit: number) {
    return this.documentStorageService.findAll({ page: page || 1, limit: limit || 10 });
  }

  @Post()
  create(@Body() body: { title: string; file_url: string }, @Request() request) {
    return this.documentStorageService.create(body.title, body.file_url, request.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.documentStorageService.delete(id);
  }
}
