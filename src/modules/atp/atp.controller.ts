import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AtpService } from './atp.service';
import { CreateAtpTemplateDto, CreateAtpSectionDto, CreateAtpItemDto } from './dto/template.dto';
import { CreateAtpDocumentDto, SaveAtpValuesDto, SubmitAtpReviewDto } from './dto/document.dto';

@ApiTags('ATP (Acceptance Test Procedure)')
@Controller({
  path: 'atp',
  version: '1',
})
export class AtpController {
  constructor(private readonly atpService: AtpService) {}

  // ==========================================
  // TEMPLATES
  // ==========================================

  @Get('templates')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getTemplates() {
    const data = await this.atpService.getTemplates();
    return { statusCode: HttpStatus.OK, data };
  }

  @Get('templates/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getTemplateById(@Param('id') id: string) {
    const data = await this.atpService.getTemplateById(+id);
    return { statusCode: HttpStatus.OK, data };
  }

  @Post('templates')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async createTemplate(@Body() dto: CreateAtpTemplateDto, @Request() req: any) {
    const data = await this.atpService.createTemplate(dto, req.user?.id);
    return { statusCode: HttpStatus.CREATED, data };
  }

  @Put('templates/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async updateTemplate(@Param('id') id: string, @Body() dto: Partial<CreateAtpTemplateDto>) {
    const data = await this.atpService.updateTemplate(+id, dto);
    return { statusCode: HttpStatus.OK, data };
  }

  @Post('templates/:id/duplicate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async duplicateTemplate(
    @Param('id') id: string,
    @Body('name') customName: string,
    @Request() req: any,
  ) {
    const data = await this.atpService.duplicateTemplate(+id, req.user?.id, customName);
    return { statusCode: HttpStatus.CREATED, data };
  }

  @Delete('templates/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async deleteTemplate(@Param('id') id: string) {
    const data = await this.atpService.deleteTemplate(+id);
    return { statusCode: HttpStatus.OK, data };
  }

  @Post('templates/:id/sections')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async createSection(@Param('id') id: string, @Body() dto: CreateAtpSectionDto) {
    const data = await this.atpService.createSection(+id, dto);
    return { statusCode: HttpStatus.CREATED, data };
  }

  @Put('templates/sections/:sectionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async updateSection(@Param('sectionId') sectionId: string, @Body() dto: Partial<CreateAtpSectionDto>) {
    const data = await this.atpService.updateSection(+sectionId, dto);
    return { statusCode: HttpStatus.OK, data };
  }

  @Delete('templates/sections/:sectionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async deleteSection(@Param('sectionId') sectionId: string) {
    const data = await this.atpService.deleteSection(+sectionId);
    return { statusCode: HttpStatus.OK, data };
  }

  @Post('templates/sections/:sectionId/items')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async createItem(@Param('sectionId') sectionId: string, @Body() dto: CreateAtpItemDto) {
    const data = await this.atpService.createItem(+sectionId, dto);
    return { statusCode: HttpStatus.CREATED, data };
  }

  @Put('templates/items/:itemId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async updateItem(@Param('itemId') itemId: string, @Body() dto: Partial<CreateAtpItemDto>) {
    const data = await this.atpService.updateItem(+itemId, dto);
    return { statusCode: HttpStatus.OK, data };
  }

  @Delete('templates/items/:itemId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async deleteItem(@Param('itemId') itemId: string) {
    const data = await this.atpService.deleteItem(+itemId);
    return { statusCode: HttpStatus.OK, data };
  }

  // ==========================================
  // DOCUMENTS
  // ==========================================

  @Get('documents')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getDocuments(
    @Query('page') page = '1',
    @Query('limit') limit = '15',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('project_id') projectId?: string,
  ) {
    const result = await this.atpService.getDocuments(+page, +limit, search, status, projectId ? +projectId : undefined);
    return { statusCode: HttpStatus.OK, ...result };
  }

  @Get('documents/public/:token')
  async getDocumentPublic(@Param('token') token: string) {
    const data = await this.atpService.getDocumentByShareToken(token);
    return { statusCode: HttpStatus.OK, data };
  }

  @Get('documents/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getDocumentById(@Param('id') id: string) {
    const data = await this.atpService.getDocumentById(+id);
    return { statusCode: HttpStatus.OK, data };
  }

  @Post('documents')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async createDocument(@Body() dto: CreateAtpDocumentDto, @Request() req: any) {
    const data = await this.atpService.createDocument(dto, req.user?.id);
    return { statusCode: HttpStatus.CREATED, data };
  }

  @Put('documents/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async updateDocument(@Param('id') id: string, @Body() dto: Partial<CreateAtpDocumentDto>) {
    const data = await this.atpService.updateDocument(+id, dto);
    return { statusCode: HttpStatus.OK, data };
  }

  @Post('documents/:id/save-values')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async saveDocumentValues(@Param('id') id: string, @Body() dto: SaveAtpValuesDto, @Request() req: any) {
    const data = await this.atpService.saveDocumentValues(+id, dto, req.user?.id);
    return { statusCode: HttpStatus.OK, data };
  }

  @Post('documents/:id/auto-fetch-photos')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async autoFetchPhotos(@Param('id') id: string) {
    const data = await this.atpService.autoFetchPhotosFromTakeData(+id);
    return { statusCode: HttpStatus.OK, data };
  }

  @Post('documents/:id/submit')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async submitForReview(@Param('id') id: string, @Request() req: any) {
    const data = await this.atpService.submitForReview(+id, req.user?.id);
    return { statusCode: HttpStatus.OK, data };
  }

  @Get('documents/:id/take-data-photos')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getTakeDataPhotos(@Param('id') id: string) {
    const data = await this.atpService.getTakeDataPhotos(+id);
    return { statusCode: HttpStatus.OK, data };
  }

  @Get('documents/public/:token/take-data-photos')
  async getPublicTakeDataPhotos(@Param('token') token: string) {
    const doc = await this.atpService.getDocumentByShareToken(token);
    const data = await this.atpService.getTakeDataPhotos(doc.id);
    return { statusCode: HttpStatus.OK, data };
  }

  @Delete('documents/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async deleteDocument(@Param('id') id: string) {
    const data = await this.atpService.deleteDocument(+id);
    return { statusCode: HttpStatus.OK, data };
  }

  // Review (both internal authenticated & external with token or role)
  @Post('documents/:id/review')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async submitReview(@Param('id') id: string, @Body() dto: SubmitAtpReviewDto, @Request() req: any) {
    const data = await this.atpService.submitReview(+id, dto, req.user?.id);
    return { statusCode: HttpStatus.OK, data };
  }

  // Public customer review submission via token
  @Post('documents/public/:token/review')
  async submitPublicReview(@Param('token') token: string, @Body() dto: SubmitAtpReviewDto) {
    const doc = await this.atpService.getDocumentByShareToken(token);
    const data = await this.atpService.submitReview(doc.id, dto, undefined);
    return { statusCode: HttpStatus.OK, data };
  }
}
