import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TakeDataTemplate } from '../../entities/take-data-template.entity';
import { TakeDataTemplateItem } from '../../entities/take-data-template-item.entity';
import { SiteTakeDataAssignment } from '../../entities/site-take-data-assignment.entity';
import { TakeDataSubmission } from '../../entities/take-data-submission.entity';
import { CreateTakeDataTemplateDto } from './dto/create-template.dto';
import { CreateTakeDataTemplateItemDto } from './dto/create-template-item.dto';
import { AssignTemplateDto } from './dto/assign-template.dto';
import { SubmitTakeDataDto } from './dto/submit-data.dto';
import { FilesService } from '../files/files.service';
import { FilePath } from 'src/utils/enums';

@Injectable()
export class TakeDataService {
    constructor(
        @InjectRepository(TakeDataTemplate)
        private templateRepository: Repository<TakeDataTemplate>,
        @InjectRepository(TakeDataTemplateItem)
        private templateItemRepository: Repository<TakeDataTemplateItem>,
        @InjectRepository(SiteTakeDataAssignment)
        private assignmentRepository: Repository<SiteTakeDataAssignment>,
        @InjectRepository(TakeDataSubmission)
        private submissionRepository: Repository<TakeDataSubmission>,
        private readonly filesService: FilesService,
    ) { }

    // Template Management
    async createTemplate(createTemplateDto: CreateTakeDataTemplateDto, userId: number) {
        const template = this.templateRepository.create({
            ...createTemplateDto,
            created_by: userId,
        });
        return this.templateRepository.save(template);
    }

    async findAllTemplates() {
        return this.templateRepository.find({
            relations: ['items', 'items.sample_photo'],
            order: { created_at: 'DESC' },
        });
    }

    async findTemplateById(id: number) {
        return this.templateRepository.findOne({
            where: { id },
            relations: ['items', 'items.sample_photo'],
        });
    }

    async addItemToTemplate(createItemDto: CreateTakeDataTemplateItemDto, file: any, userId: number) {
        const template = await this.templateRepository.findOne({ where: { id: createItemDto.template_id } });
        if (!template) {
            throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
        }

        let samplePhotoId = null;
        if (file) {
            const photoEntity = await this.filesService.uploadFile(
                file,
                userId,
                FilePath.TAKE_DATA,
                'Sample Photo'
            );
            samplePhotoId = photoEntity.id;
        }

        const item = this.templateItemRepository.create({
            ...createItemDto,
            sample_photo_id: samplePhotoId ? samplePhotoId : createItemDto.sample_photo_id
        });
        return this.templateItemRepository.save(item);
    }

    // Assignment
    async assignTemplateToSite(assignDto: AssignTemplateDto, userId: number) {
        // Check if already assigned
        const existing = await this.assignmentRepository.findOne({
            where: {
                site_id: assignDto.site_id,
                template_id: assignDto.template_id,
            },
        });

        if (existing) {
            throw new HttpException('Template already assigned to this site', HttpStatus.BAD_REQUEST);
        }

        const assignment = this.assignmentRepository.create({
            ...assignDto,
            assigned_by: userId,
            status: 'pending',
            progress: 0,
        });
        return this.assignmentRepository.save(assignment);
    }

    async getAssignments() {
        return this.assignmentRepository.find({
            relations: ['site', 'template'],
            order: { created_at: 'DESC' },
        });
    }

    // Android API
    async getTemplatesForSite(siteId: number) {
        const assignments = await this.assignmentRepository.find({
            where: { site_id: siteId },
            relations: ['template', 'template.items', 'template.items.sample_photo', 'submissions', 'submissions.photo'],
        });

        // Map to a more friendly format for Android if needed, or return as is.
        // For now returning as is, but including submissions is important to show what's already done.
        return assignments;
    }

    async submitData(submitDto: SubmitTakeDataDto, file: any, userId: number) {
        const assignment = await this.assignmentRepository.findOne({ where: { id: submitDto.assignment_id } });
        if (!assignment) {
            throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
        }

        // Upload photo
        const photoEntity = await this.filesService.uploadFile(
            file,
            userId,
            FilePath.USER, // Using USER path for now, maybe create a specific one?
            'Take Data Photo'
        );

        const submission = this.submissionRepository.create({
            assignment_id: submitDto.assignment_id,
            template_item_id: submitDto.template_item_id,
            photo_id: photoEntity.id,
            coordinate: submitDto.coordinate,
            timestamp: submitDto.timestamp,
            submitted_by: userId,
        });

        await this.submissionRepository.save(submission);

        // Update progress
        await this.updateAssignmentProgress(assignment.id);

        return submission;
    }

    private async updateAssignmentProgress(assignmentId: number) {
        const assignment = await this.assignmentRepository.findOne({
            where: { id: assignmentId },
            relations: ['template', 'template.items', 'submissions'],
        });

        if (!assignment) return;

        const totalItems = assignment.template.items.length;
        // Count unique items submitted. 
        // Logic: Each item needs min_photos? 
        // Plan says "each foto will give a name by admin". Usually 1 photo per item unless specified.
        // Plan also says "each colomn minimum to take data is 3 photo". Wait.
        // "each colomn minimum to take data is 3 photo" means one TemplateItem requires 3 photos?
        // My entity `TakeDataTemplateItem` has `min_photos`.

        // Let's implement robust progress calculation.
        // For each item, check if submission count >= min_photos.

        let completedItems = 0;

        for (const item of assignment.template.items) {
            const submissionCount = assignment.submissions.filter(s => s.template_item_id === item.id).length;
            if (submissionCount >= item.min_photos) {
                completedItems++;
            }
        }

        const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

        assignment.progress = progress;
        if (progress === 100) {
            assignment.status = 'completed';
        } else if (progress > 0) {
            assignment.status = 'in_progress';
        }

        await this.assignmentRepository.save(assignment);
    }
}
