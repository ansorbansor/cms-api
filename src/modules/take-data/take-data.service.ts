import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TakeDataTemplate } from '../../entities/take-data-template.entity';
import { TakeDataTemplateItem } from '../../entities/take-data-template-item.entity';
import { SiteTakeDataAssignment } from '../../entities/site-take-data-assignment.entity';
import { TakeDataSubmission } from '../../entities/take-data-submission.entity';
import { User } from '../../entities/user.entity';
import { CreateTakeDataTemplateDto } from './dto/create-template.dto';
import { CreateTakeDataTemplateItemDto } from './dto/create-template-item.dto';
import { UpdateTakeDataTemplateDto } from './dto/update-template.dto';
import { UpdateTakeDataTemplateItemDto } from './dto/update-template-item.dto';
import { AssignTemplateDto } from './dto/assign-template.dto';
import { SubmitTakeDataDto } from './dto/submit-data.dto';
import { GenerateDocumentDto } from './dto/generate-document.dto';
import { FilesService } from '../files/files.service';
import { FilePath } from 'src/utils/enums';
import * as exceljs from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';



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
        @InjectRepository(User)
        private userRepository: Repository<User>,
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
        const templates = await this.templateRepository.find({
            relations: ['items', 'items.sample_photo'],
            order: { created_at: 'DESC' },
        });
        // Sort items by order ASC
        templates.forEach(t => {
            if (t.items) t.items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        });
        return templates;
    }

    async findTemplateById(id: number) {
        const template = await this.templateRepository.findOne({
            where: { id },
            relations: ['items', 'items.sample_photo'],
        });
        if (template?.items) {
            template.items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }
        return template;
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

        // Auto-assign order to the end
        const existingCount = await this.templateItemRepository.count({ where: { template_id: createItemDto.template_id } });

        const item = this.templateItemRepository.create({
            ...createItemDto,
            sample_photo_id: samplePhotoId ? samplePhotoId : createItemDto.sample_photo_id,
            order: existingCount,
        });
        return this.templateItemRepository.save(item);
    }

    async updateTemplate(id: number, updateDto: UpdateTakeDataTemplateDto) {
        const template = await this.templateRepository.findOne({ where: { id } });
        if (!template) {
            throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
        }

        Object.assign(template, updateDto);
        return this.templateRepository.save(template);
    }

    async updateItem(id: number, updateDto: UpdateTakeDataTemplateItemDto, file: any, userId: number) {
        const item = await this.templateItemRepository.findOne({ where: { id } });
        if (!item) {
            throw new HttpException('Template Item not found', HttpStatus.NOT_FOUND);
        }

        if (file) {
            const photoEntity = await this.filesService.uploadFile(
                file,
                userId,
                FilePath.TAKE_DATA,
                'Sample Photo'
            );
            updateDto.sample_photo_id = photoEntity.id;
            item.sample_photo = photoEntity;
        }

        Object.assign(item, updateDto);
        return this.templateItemRepository.save(item);
    }

    // Reorder items
    async reorderItems(templateId: number, itemIds: number[]) {
        const template = await this.templateRepository.findOne({ where: { id: templateId } });
        if (!template) {
            throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
        }

        const updates = itemIds.map((id, index) =>
            this.templateItemRepository.update({ id, template_id: templateId }, { order: index })
        );
        await Promise.all(updates);

        return { message: 'Items reordered successfully' };
    }

    // Assignment
    async assignTemplateToSite(assignDto: AssignTemplateDto, userId: number) {
        // Removed the check that prevented assigning the same template multiple times
        // to allow sites to have the same template assigned for different tasks/events.

        const assignment = this.assignmentRepository.create({
            ...assignDto,
            assigned_by: userId,
            status: 'pending',
            progress: 0,
        });
        return this.assignmentRepository.save(assignment);
    }

    async getAssignments(page = 1, limit = 10, search?: string, reviewStatus?: string) {
        const skip = (page - 1) * limit;

        const qb = this.assignmentRepository.createQueryBuilder('a')
            .leftJoinAndSelect('a.site', 'site')
            .leftJoinAndSelect('a.template', 'template')
            .leftJoinAndSelect('template.items', 'items')
            .leftJoinAndSelect('items.sample_photo', 'sample_photo')
            .leftJoinAndSelect('a.reviewer', 'reviewer')
            .orderBy('a.created_at', 'DESC')
            .skip(skip)
            .take(limit);

        if (search && search.trim()) {
            const term = `%${search.trim().toLowerCase()}%`;
            qb.andWhere(
                '(LOWER(site.code) LIKE :term OR LOWER(site.name) LIKE :term)',
                { term }
            );
        }

        if (reviewStatus && reviewStatus.trim() && reviewStatus !== 'all') {
            if (reviewStatus === 'pending') {
                qb.andWhere('(a.review_status IS NULL OR a.review_status = :pending)', { pending: 'pending' });
            } else {
                qb.andWhere('a.review_status = :reviewStatus', { reviewStatus });
            }
        }

        const [data, total] = await qb.getManyAndCount();

        // Fetch submissions separately to avoid Cartesian product
        if (data.length > 0) {
            const assignmentIds = data.map(a => a.id);
            const submissions = await this.submissionRepository
                .createQueryBuilder('sub')
                .leftJoinAndSelect('sub.photo', 'photo')
                .where('sub.assignment_id IN (:...ids)', { ids: assignmentIds })
                .getMany();

            data.forEach(a => {
                a.submissions = submissions.filter(s => s.assignment_id === a.id);
            });
        }

        // Sort template items by order ASC
        data.forEach(a => {
            if (a.template?.items) {
                a.template.items.sort((x, y) => (x.order ?? 0) - (y.order ?? 0));
            }
        });
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async reviewAssignment(
        id: number,
        reviewDto: import('./dto/review-assignment.dto').ReviewAssignmentDto,
        userId: number
    ) {
        const assignment = await this.assignmentRepository.findOne({ where: { id } });
        if (!assignment) {
            throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
        }

        // Determine overall status based on whether ANY item is rejected
        let overallStatus = 'Passed';
        const itemReviews = reviewDto.item_reviews;

        for (const key in itemReviews) {
            if (itemReviews[key].status === 'Rejected') {
                overallStatus = 'Rejected';
                break;
            }
        }

        assignment.review_status = overallStatus;
        assignment.item_reviews = JSON.stringify(itemReviews);
        assignment.reviewed_by = userId;
        assignment.reviewed_at = new Date();

        return this.assignmentRepository.save(assignment);
    }

    async deleteAssignment(id: number, reqUser: any) {
        // Fetch full user to get employeePosition details
        const user = await this.userRepository.findOne({
            where: { id: reqUser.id },
            relations: ['employeePosition'] // Ensure employeePosition is loaded
        });

        // Enforce Super Admin only. They must explicitly be role 1 or explicitly have grant_all_access.
        const isSuperAdmin = user?.employee_position_id === 1 || user?.employee_position_id?.toString() === '1' || user?.employeePosition?.grant_all_access === true;

        if (!isSuperAdmin) {
            throw new HttpException('Only Super Admin can delete assignments', HttpStatus.FORBIDDEN);
        }

        const assignment = await this.assignmentRepository.findOne({
            where: { id },
            relations: ['submissions']
        });

        if (!assignment) {
            throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
        }

        if (assignment.submissions && assignment.submissions.length > 0) {
            // Delete associated submissions first. TypeORM might cascade in some configs,
            // but manually deleting ensures we don't hit foreign key constraints if cascade is off.
            await this.submissionRepository.remove(assignment.submissions);
        }

        await this.assignmentRepository.remove(assignment);
        return { message: 'Assignment deleted successfully' };
    }

    async aiReviewItem(assignmentId: number, itemId: number, userId: number) {
        const assignment = await this.assignmentRepository.findOne({
            where: { id: assignmentId },
            relations: ['template', 'template.items']
        });

        if (!assignment) {
            throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
        }

        const templateItem = assignment.template?.items?.find(i => i.id == itemId);
        if (!templateItem || !templateItem.image_criteria) {
             throw new HttpException('Item not found or has no AI criteria', HttpStatus.BAD_REQUEST);
        }

        // Check if already reviewed (resume functionality)
        let itemReviews: any = {};
        try {
            if (assignment.item_reviews) {
                 itemReviews = JSON.parse(assignment.item_reviews);
            }
        } catch(e) {}

        if (itemReviews[itemId] && itemReviews[itemId].status) {
            return { message: 'Already reviewed', status: itemReviews[itemId].status };
        }

        // Fetch submissions
        const submissions = await this.submissionRepository
            .createQueryBuilder('sub')
            .leftJoinAndSelect('sub.photo', 'photo')
            .where('sub.assignment_id = :aid AND sub.template_item_id = :tid', { aid: assignmentId, tid: itemId })
            .getMany();

        if (submissions.length === 0) {
            throw new HttpException('No submissions found for this item', HttpStatus.BAD_REQUEST);
        }

        // Gather valid image paths
        const imagePaths = [];
        for (const sub of submissions) {
             if (sub.photo && sub.photo.path) {
                 const physicalName = sub.photo.path.split('/').pop();
                 if (physicalName) {
                     const photoPath = path.join(process.cwd(), 'files', physicalName);
                     if (fs.existsSync(photoPath)) {
                         imagePaths.push(photoPath);
                     }
                 }
             }
        }

        if (imagePaths.length === 0) {
            throw new HttpException('No physical photos found', HttpStatus.BAD_REQUEST);
        }

        // Stitch images with Jimp
        const { Jimp } = require('jimp');
        let finalBase64 = '';
        try {
             if (imagePaths.length === 1) {
                  // Just read as base64
                  const ext = path.extname(imagePaths[0]).substring(1).toLowerCase();
                  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
                  const buffer = fs.readFileSync(imagePaths[0]);
                  finalBase64 = `data:${mime};base64,${buffer.toString('base64')}`;
             } else {
                  // Stitch images horizontally
                  const images = await Promise.all(imagePaths.map(p => Jimp.read(p)));
                  const totalWidth = images.reduce((sum, img) => sum + img.bitmap.width, 0);
                  const maxHeight = Math.max(...images.map(img => img.bitmap.height));

                  const newImage = new Jimp({ width: totalWidth, height: maxHeight, color: 0xFFFFFFFF });
                  let currentX = 0;
                  for (const img of images) {
                       newImage.composite(img, currentX, 0);
                       currentX += img.bitmap.width;
                  }
                  
                  finalBase64 = await newImage.getBase64('image/jpeg');
             }
        } catch(e) {
             console.error('Image processing error:', e);
             throw new HttpException('Failed to process images for AI', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Call LiteLLM
        const { getFlag } = require('../../utils/feature-flags.util');
        const url = getFlag('litellm_url');
        const model = getFlag('litellm_model');
        const apiKey = getFlag('litellm_api_key');
        const systemMessage = getFlag('ai_system_message');

        const axios = require('axios');
        let aiResult = { status: 'Rejected', remarks: 'AI evaluation failed' };
        
        try {
            const payload = {
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: systemMessage
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Review this image against the following criteria: "${templateItem.image_criteria}". Does the image meet the criteria? You MUST respond in pure JSON format ONLY: {"status": "Passed" or "Rejected", "remarks": "Berikan alasan penolakan dalam Bahasa Indonesia jika Rejected, atau kosongkan jika Passed"}`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: finalBase64
                                }
                            }
                        ]
                    }
                ],
                response_format: { type: 'json_object' }
            };

            const headers: any = { 'Content-Type': 'application/json' };
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            const response = await axios.post(url, payload, { headers, timeout: 60000 });
            const content = response.data.choices[0].message.content;
            
            // Clean up backticks if model returns them
            let jsonString = content.trim();
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            } else if (jsonString.startsWith('```')) {
                jsonString = jsonString.substring(3, jsonString.length - 3).trim();
            }

            const parsed = JSON.parse(jsonString);
            if (parsed.status === 'Passed' || parsed.status === 'Rejected') {
                 aiResult = parsed;
            } else {
                 aiResult.remarks = parsed.remarks || 'Invalid AI response format';
            }
        } catch(e) {
            console.error('LiteLLM Error:', e.response?.data || e.message);
            if (e.response && e.response.status === 429) {
                 throw new HttpException('AI Rate limit reached', HttpStatus.TOO_MANY_REQUESTS);
            }
            throw new HttpException('AI connection failed', HttpStatus.SERVICE_UNAVAILABLE);
        }

        // Save review
        itemReviews[itemId] = {
             status: aiResult.status,
             remarks: aiResult.remarks || ''
        };
        assignment.item_reviews = JSON.stringify(itemReviews);

        // Check overall status (if all items with image_criteria are reviewed)
        const targetItems = assignment.template.items.filter(i => i.type !== 'form' && i.image_criteria);
        let allCompleted = true;
        let overallStatus = 'Passed by AI';

        for (const target of targetItems) {
            if (!itemReviews[target.id] || !itemReviews[target.id].status) {
                allCompleted = false;
                break;
            }
        }

        if (allCompleted) {
             for (const target of targetItems) {
                 if (itemReviews[target.id] && itemReviews[target.id].status === 'Rejected') {
                     overallStatus = 'Rejected by AI';
                     break;
                 }
             }
             assignment.review_status = overallStatus;
             assignment.reviewed_by = userId;
             assignment.reviewed_at = new Date();
        }

        await this.assignmentRepository.save(assignment);
        return { message: 'Review saved', result: itemReviews[itemId] };
    }

    // Android API
    async getTemplatesForSite(siteId: number) {
        const assignments = await this.assignmentRepository.find({
            where: { site_id: siteId },
            relations: ['template', 'template.items', 'template.items.sample_photo'],
        });

        if (assignments.length > 0) {
            const assignmentIds = assignments.map(a => a.id);
            const submissions = await this.submissionRepository
                .createQueryBuilder('sub')
                .leftJoinAndSelect('sub.photo', 'photo')
                .where('sub.assignment_id IN (:...ids)', { ids: assignmentIds })
                .getMany();

            assignments.forEach(a => {
                a.submissions = submissions.filter(s => s.assignment_id === a.id);
            });
        }

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
        let photoEntityId = null;
        if (file) {
            const photoEntity = await this.filesService.uploadFile(
                file,
                userId,
                FilePath.USER, // Using USER path for now, maybe create a specific one?
                'Take Data Photo'
            );
            photoEntityId = photoEntity.id;
        }

        if (submitDto.text_data && !photoEntityId) {
            let existingSubmission = await this.submissionRepository.findOne({
                where: {
                    assignment_id: submitDto.assignment_id,
                    template_item_id: submitDto.template_item_id,
                }
            });

            if (existingSubmission) {
                existingSubmission.text_data = submitDto.text_data;
                existingSubmission.timestamp = submitDto.timestamp || existingSubmission.timestamp;
                existingSubmission.submitted_by = userId;
                await this.submissionRepository.save(existingSubmission);
                return existingSubmission;
            }
        }

        const submission = this.submissionRepository.create({
            assignment_id: submitDto.assignment_id,
            template_item_id: submitDto.template_item_id,
            photo_id: photoEntityId,
            text_data: submitDto.text_data,
            coordinate: submitDto.coordinate,
            timestamp: submitDto.timestamp,
            submitted_by: userId,
        });

        await this.submissionRepository.save(submission);

        // Update progress
        await this.updateAssignmentProgress(assignment.id);

        return submission;
    }

    async deleteSubmission(submissionId: number, reqUser: any) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId },
            relations: ['assignment'],
        });

        if (!submission) {
            throw new HttpException('Submission not found', HttpStatus.NOT_FOUND);
        }

        // Load the assignment to check review status
        const assignment = await this.assignmentRepository.findOne({
            where: { id: submission.assignment_id },
        });

        if (!assignment) {
            throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
        }

        // Block deletion if the assignment has already passed review
        if (assignment.review_status === 'Passed') {
            throw new HttpException(
                'Cannot delete a submission whose assignment has already Passed review.',
                HttpStatus.FORBIDDEN,
            );
        }

        await this.submissionRepository.remove(submission);

        // Recalculate progress after deletion
        await this.updateAssignmentProgress(assignment.id);

        return { message: 'Submission deleted', submissionId };
    }

    async downloadAssignmentPhotos(assignmentId: number, res: any) {
        const assignment = await this.assignmentRepository.findOne({
            where: { id: assignmentId },
            relations: ['site', 'template', 'template.items'],
        });

        if (!assignment) {
            throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
        }

        const submissions = await this.submissionRepository
            .createQueryBuilder('sub')
            .leftJoinAndSelect('sub.photo', 'photo')
            .where('sub.assignment_id = :id', { id: assignmentId })
            .getMany();
        assignment.submissions = submissions;

        const archive = require('archiver')('zip', {
            zlib: { level: 1 }, // Changed from 9 to 1 to prevent CPU overload
        });

        res.attachment(`${assignment.site.code}_${assignment.template.name}.zip`);
        archive.pipe(res);

        const path = require('path');
        const fs = require('fs');

        for (const item of assignment.template.items) {
            const folderName = item.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const submissions = assignment.submissions.filter(s => s.template_item_id === item.id);

            for (const sub of submissions) {
                if (sub.photo && sub.photo.path) {
                    // Get the physical file name from path, e.g. /api/v1/files/UUID_filename.jpg
                    const physicalName = sub.photo.path.split('/').pop();
                    if (!physicalName) continue;

                    // Assuming files are stored in ./files relative to cwd
                    const filePath = path.join(process.cwd(), 'files', physicalName);
                    if (fs.existsSync(filePath)) {
                        const displayName = sub.photo.name || physicalName;
                        archive.file(filePath, { name: `${folderName}/${displayName}` });
                    }
                }
            }
        }

        const formItems = assignment.template.items.filter(i => i.type === 'form');
        if (formItems.length > 0) {
            const exceljs = require('exceljs');
            const tempWorkbook = new exceljs.Workbook();
            const formSheet = tempWorkbook.addWorksheet('Form Data');
            const headers = ['Site ID', ...formItems.map(i => i.name)];
            formSheet.addRow(headers);
            const valuesRow = [assignment.custom_watermark || assignment.site.code || 'N/A'];
            for (const item of formItems) {
                const sub = submissions.find(s => s.template_item_id === item.id);
                valuesRow.push(sub && sub.text_data ? sub.text_data : '');
            }
            formSheet.addRow(valuesRow);

            formSheet.getRow(1).font = { bold: true };
            headers.forEach((h, i) => {
                formSheet.getColumn(i + 1).width = 30;
            });

            const buffer = await tempWorkbook.xlsx.writeBuffer();
            archive.append(buffer, { name: 'Form_Data.xlsx' });
        }

        await archive.finalize();
    }

    private async updateAssignmentProgress(assignmentId: number) {
        const assignment = await this.assignmentRepository.findOne({
            where: { id: assignmentId },
            relations: ['template', 'template.items'],
        });

        if (!assignment || !assignment.template || !assignment.template.items) return;

        const totalItems = assignment.template.items.length;
        if (totalItems === 0) return;

        const submissionCounts = await this.submissionRepository
            .createQueryBuilder('submission')
            .select('submission.template_item_id', 'itemId')
            .addSelect('COUNT(submission.id)', 'count')
            .where('submission.assignment_id = :assignmentId', { assignmentId })
            .groupBy('submission.template_item_id')
            .getRawMany();

        const countMap = new Map();
        submissionCounts.forEach(sc => {
            countMap.set(sc.itemId, Number(sc.count));
        });

        let completedItems = 0;

        for (const item of assignment.template.items) {
            const submissionCount = countMap.get(item.id) || 0;
            const minPhotos = item.min_photos && item.min_photos > 0 ? item.min_photos : 1;

            if (submissionCount >= minPhotos) {
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

    async generateDocument(generateDto: GenerateDocumentDto, file: any, res: any) {
        const assignment = await this.assignmentRepository.findOne({
            where: { id: generateDto.assignment_id },
            relations: ['site', 'template', 'template.items'],
        });

        if (!assignment) {
            throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
        }

        const submissions = await this.submissionRepository
            .createQueryBuilder('sub')
            .leftJoinAndSelect('sub.photo', 'photo')
            .where('sub.assignment_id = :id', { id: generateDto.assignment_id })
            .getMany();
        assignment.submissions = submissions;

        const workbook = new exceljs.Workbook();
        if (file.buffer) {
            await workbook.xlsx.load(file.buffer);
        } else if (file.path) {
            await workbook.xlsx.readFile(file.path);
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        } else {
            throw new HttpException('Uploaded file is invalid or missing', HttpStatus.BAD_REQUEST);
        }

        const items = assignment.template.items;

        workbook.eachSheet((worksheet, sheetId) => {
            worksheet.eachRow((row, rowNumber) => {
                row.eachCell((cell, colNumber) => {
                    if (cell.type === exceljs.ValueType.String && cell.value) {
                        const cellText = cell.value.toString().trim();
                        if (cellText.toLowerCase().startsWith('simpro:')) {
                            const itemNamePart = cellText.substring(7).trim(); // Remove 'simpro:'

                            // Find matching item (case-insensitive)
                            const matchedItem = items.find(item => item.name.toLowerCase() === itemNamePart.toLowerCase());

                            if (matchedItem) {
                                // Find a submission for this item
                                const submission = submissions.find(s => s.template_item_id === matchedItem.id);

                                if (submission) {
                                    if (submission.text_data) {
                                        cell.value = submission.text_data;
                                    } else if (submission.photo && submission.photo.name) {
                                        const photoPath = path.join(process.cwd(), 'files', submission.photo.name);
                                        if (fs.existsSync(photoPath)) {
                                            const ext = path.extname(photoPath).toLowerCase();
                                            const imageExtensionPattern = /\.(jpeg|jpg|png|gif)$/i;

                                            if (imageExtensionPattern.test(ext)) {
                                                const imageId = workbook.addImage({
                                                    filename: photoPath,
                                                    extension: ext === '.png' ? 'png' : ext === '.gif' ? 'gif' : 'jpeg',
                                                });

                                                // Clear the placeholder text
                                                cell.value = '';

                                                // Read original image dimensions
                                                let imgW = 100;
                                                let imgH = 100;
                                                try {
                                                    const sizeOfModule = require('image-size');
                                                    const sizeOf = typeof sizeOfModule === 'function' ? sizeOfModule : (sizeOfModule.imageSize || sizeOfModule.default);
                                                    // Pass filepath instead of full buffer to save RAM/CPU
                                                    const dimensions = sizeOf(photoPath);
                                                    imgW = dimensions.width || 100;
                                                    imgH = dimensions.height || 100;
                                                } catch (e) {
                                                    console.error('Failed to read image dimensions', e);
                                                }

                                                // Helper to get Excel cell dimensions in pixels
                                                const getColWidth = (c) => (c && c.width ? c.width : 8.43) * 7.5;
                                                const getRowHeight = (r) => (r && r.height ? r.height : 15) * 1.33;

                                                let boxW = getColWidth(worksheet.getColumn(Number(cell.col)));
                                                let boxH = getRowHeight(worksheet.getRow(Number(cell.row)));
                                                let startCellNode = cell;

                                                const masterNode = cell.master;

                                                if (masterNode && (masterNode.address !== cell.address || worksheet.model.merges?.some(m => m.includes(masterNode.address)))) {
                                                    const mergeLabel = worksheet.model.merges?.find(m => m.startsWith(masterNode.address + ':'));
                                                    if (mergeLabel) {
                                                        const [start, end] = mergeLabel.split(':');
                                                        const startCell = worksheet.getCell(start);
                                                        const endCell = worksheet.getCell(end);
                                                        startCellNode = startCell;

                                                        boxW = 0;
                                                        for (let c = Number(startCell.col); c <= Number(endCell.col); c++) {
                                                            boxW += getColWidth(worksheet.getColumn(c));
                                                        }
                                                        boxH = 0;
                                                        for (let r = Number(startCell.row); r <= Number(endCell.row); r++) {
                                                            boxH += getRowHeight(worksheet.getRow(r));
                                                        }
                                                    }
                                                }

                                                // Scale image to fit within the box while preserving aspect ratio
                                                const padding = 0.95; // 5% padding
                                                const scaleW = (boxW * padding) / imgW;
                                                const scaleH = (boxH * padding) / imgH;
                                                const scale = Math.min(scaleW, scaleH);

                                                const finalW = imgW * scale;
                                                const finalH = imgH * scale;

                                                // Calculate centering offsets
                                                let offsetX = (boxW - finalW) / 2;
                                                let offsetY = (boxH - finalH) / 2;

                                                let colBase = Number(startCellNode.col) - 1;
                                                let cIdx = Number(startCellNode.col);
                                                while (offsetX > 0) {
                                                    let w = getColWidth(worksheet.getColumn(cIdx));
                                                    if (offsetX < w) {
                                                        colBase += (offsetX / w);
                                                        break;
                                                    } else {
                                                        offsetX -= w;
                                                        colBase += 1;
                                                        cIdx++;
                                                    }
                                                }

                                                let rowBase = Number(startCellNode.row) - 1;
                                                let rIdx = Number(startCellNode.row);
                                                while (offsetY > 0) {
                                                    let h = getRowHeight(worksheet.getRow(rIdx));
                                                    if (offsetY < h) {
                                                        rowBase += (offsetY / h);
                                                        break;
                                                    } else {
                                                        offsetY -= h;
                                                        rowBase += 1;
                                                        rIdx++;
                                                    }
                                                }

                                                // Convert final width and height to br relative to the calculated tl (colBase, rowBase)
                                                let brCol = colBase;
                                                let remainingW = finalW;
                                                let tempColIdx = Math.floor(colBase);
                                                // Handle fractional part of start column first
                                                let firstColW = getColWidth(worksheet.getColumn(tempColIdx + 1));
                                                let startingFractionW = firstColW * (1 - (colBase % 1));

                                                if (remainingW <= startingFractionW) {
                                                    brCol += (remainingW / firstColW);
                                                } else {
                                                    brCol += (1 - (colBase % 1));
                                                    remainingW -= startingFractionW;
                                                    tempColIdx++;
                                                    while (remainingW > 0) {
                                                        let cw = getColWidth(worksheet.getColumn(tempColIdx + 1));
                                                        if (remainingW <= cw) {
                                                            brCol += (remainingW / cw);
                                                            break;
                                                        } else {
                                                            brCol += 1;
                                                            remainingW -= cw;
                                                            tempColIdx++;
                                                        }
                                                    }
                                                }

                                                let brRow = rowBase;
                                                let remainingH = finalH;
                                                let tempRowIdx = Math.floor(rowBase);
                                                let firstRowH = getRowHeight(worksheet.getRow(tempRowIdx + 1));
                                                let startingFractionH = firstRowH * (1 - (rowBase % 1));

                                                if (remainingH <= startingFractionH) {
                                                    brRow += (remainingH / firstRowH);
                                                } else {
                                                    brRow += (1 - (rowBase % 1));
                                                    remainingH -= startingFractionH;
                                                    tempRowIdx++;
                                                    while (remainingH > 0) {
                                                        let rh = getRowHeight(worksheet.getRow(tempRowIdx + 1));
                                                        if (remainingH <= rh) {
                                                            brRow += (remainingH / rh);
                                                            break;
                                                        } else {
                                                            brRow += 1;
                                                            remainingH -= rh;
                                                            tempRowIdx++;
                                                        }
                                                    }
                                                }

                                                // Insert image with computed extension to preserve aspect ratio
                                                worksheet.addImage(imageId, {
                                                    tl: { col: colBase, row: rowBase } as any,
                                                    br: { col: brCol, row: brRow } as any,
                                                    editAs: 'oneCell'
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${assignment.site.code}_Document.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    }
}
