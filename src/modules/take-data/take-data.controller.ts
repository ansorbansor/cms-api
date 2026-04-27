import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    Request,
    Res,
    Put,
    Delete,
    HttpException,
    HttpStatus
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { TakeDataService } from './take-data.service';
import { CreateTakeDataTemplateDto } from './dto/create-template.dto';
import { CreateTakeDataTemplateItemDto } from './dto/create-template-item.dto';
import { UpdateTakeDataTemplateDto } from './dto/update-template.dto';
import { UpdateTakeDataTemplateItemDto } from './dto/update-template-item.dto';
import { AssignTemplateDto } from './dto/assign-template.dto';
import { SubmitTakeDataDto } from './dto/submit-data.dto';
import { GenerateDocumentDto } from './dto/generate-document.dto';
import { successResponse, successResponseListWithoutPaginate } from '../../utils/responses';

@ApiTags('Take Data')
@Controller({
    path: 'take-data',
    version: '1',
})
export class TakeDataController {
    constructor(private readonly takeDataService: TakeDataService) { }

    // Templates
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post('templates')
    async createTemplate(@Body() createDto: CreateTakeDataTemplateDto, @Request() request) {
        console.log('Create Template Request:', createDto);
        console.log('User:', request.user);
        try {
            const result = await this.takeDataService.createTemplate(createDto, request.user.id);
            return successResponse(result, 'Template created successfully');
        } catch (error) {
            console.error('Error creating template:', error);
            throw error;
        }
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('templates')
    async findAllTemplates() {
        const result = await this.takeDataService.findAllTemplates();
        return successResponseListWithoutPaginate(result as any, 'Templates retrieved successfully');
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post('templates/items')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('sample_photo'))
    async addItem(@Body() createItemDto: CreateTakeDataTemplateItemDto, @UploadedFile() file, @Request() request) {
        const result = await this.takeDataService.addItemToTemplate(createItemDto, file, request.user.id);
        return successResponse(result, 'Item added successfully');
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Put('templates/:id')
    async updateTemplate(
        @Param('id') id: number,
        @Body() updateDto: UpdateTakeDataTemplateDto
    ) {
        const result = await this.takeDataService.updateTemplate(id, updateDto);
        return successResponse(result, 'Template updated successfully');
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Put('templates/items/:id')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('sample_photo'))
    async updateItem(
        @Param('id') id: number,
        @Body() updateItemDto: UpdateTakeDataTemplateItemDto,
        @UploadedFile() file,
        @Request() request
    ) {
        const result = await this.takeDataService.updateItem(id, updateItemDto, file, request.user.id);
        return successResponse(result, 'Item updated successfully');
    }

    // Assignments
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post('assign')
    async assignTemplate(@Body() assignDto: AssignTemplateDto, @Request() request) {
        const result = await this.takeDataService.assignTemplateToSite(assignDto, request.user.id);
        return successResponse(result, 'Template assigned successfully');
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('assignments')
    async getAssignments(
        @Query('page') page = 1,
        @Query('limit') limit = 10,
    ) {
        const result = await this.takeDataService.getAssignments(Number(page), Number(limit));
        return successResponse(result, 'Assignments retrieved successfully');
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('assignments/:id/download')
    async downloadPhotos(@Param('id') id: number, @Res() res) {
        return this.takeDataService.downloadAssignmentPhotos(id, res);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Delete('assignments/:id')
    async deleteAssignment(@Param('id') id: number, @Request() request) {
        const result = await this.takeDataService.deleteAssignment(id, request.user);
        return successResponse(result, 'Assignment deleted successfully');
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post('assignments/:id/review')
    async reviewAssignment(
        @Param('id') id: number,
        @Body() reviewDto: import('./dto/review-assignment.dto').ReviewAssignmentDto,
        @Request() request
    ) {
        const result = await this.takeDataService.reviewAssignment(id, reviewDto, request.user.id);
        return successResponse(result, 'Assignment reviewed successfully');
    }

    // Android
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('sites/:siteId')
    async getTemplatesForSite(@Param('siteId') siteId: number) {
        const result = await this.takeDataService.getTemplatesForSite(siteId);
        return successResponseListWithoutPaginate(result as any, 'Templates retrieved successfully');
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post('submit')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('photo'))
    async submitData(
        @Body() submitDto: SubmitTakeDataDto, 
        @Body('latitude') latitude: string, 
        @Body('longitude') longitude: string, 
        @UploadedFile() file, 
        @Request() request
    ) {
        const perfKey = `submitData-${Date.now()}`;
        console.time(perfKey);
        try {
            if (latitude && longitude && !submitDto.coordinate) {
                submitDto.coordinate = `${latitude},${longitude}`;
            }
            if (!submitDto.timestamp) {
                submitDto.timestamp = new Date();
            }
            const result = await this.takeDataService.submitData(submitDto, file, request.user.id);
            console.timeEnd(perfKey);
            return successResponse(result, 'Data submitted successfully');
        } catch (e) {
            console.timeEnd(perfKey);
            console.error('SubmitTakeData Error:', e);
            throw new HttpException(
                e.message || 'Internal server error while submitting data', 
                e.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post('generate-document')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    async generateDocument(@Body() generateDto: GenerateDocumentDto, @UploadedFile() file, @Res() res) {
        return this.takeDataService.generateDocument(generateDto, file, res);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Delete('submission/:id')
    async deleteSubmission(@Param('id') id: number, @Request() request) {
        try {
            const result = await this.takeDataService.deleteSubmission(id, request.user);
            return successResponse(result, 'Submission deleted successfully');
        } catch (e) {
            throw new HttpException(
                e.message || 'Failed to delete submission',
                e.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}

