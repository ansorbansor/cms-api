import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { TakeDataService } from './take-data.service';
import { CreateTakeDataTemplateDto } from './dto/create-template.dto';
import { CreateTakeDataTemplateItemDto } from './dto/create-template-item.dto';
import { AssignTemplateDto } from './dto/assign-template.dto';
import { SubmitTakeDataDto } from './dto/submit-data.dto';

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
            return await this.takeDataService.createTemplate(createDto, request.user.id);
        } catch (error) {
            console.error('Error creating template:', error);
            throw error;
        }
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('templates')
    async findAllTemplates() {
        return this.takeDataService.findAllTemplates();
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post('templates/items')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('sample_photo'))
    async addItem(@Body() createItemDto: CreateTakeDataTemplateItemDto, @UploadedFile() file, @Request() request) {
        return this.takeDataService.addItemToTemplate(createItemDto, file, request.user.id);
    }

    // Assignments
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post('assign')
    async assignTemplate(@Body() assignDto: AssignTemplateDto, @Request() request) {
        return this.takeDataService.assignTemplateToSite(assignDto, request.user.id);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('assignments')
    async getAssignments() {
        return this.takeDataService.getAssignments();
    }

    // Android
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('sites/:siteId')
    async getTemplatesForSite(@Param('siteId') siteId: number) {
        return this.takeDataService.getTemplatesForSite(siteId);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post('submit')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('photo'))
    async submitData(@Body() submitDto: SubmitTakeDataDto, @UploadedFile() file, @Request() request) {
        return this.takeDataService.submitData(submitDto, file, request.user.id);
    }
}
