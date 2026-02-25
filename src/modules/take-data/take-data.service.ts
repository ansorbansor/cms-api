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
            relations: ['site', 'template', 'template.items', 'template.items.sample_photo', 'submissions', 'submissions.photo'],
            order: { created_at: 'DESC' },
        });
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

    async downloadAssignmentPhotos(assignmentId: number, res: any) {
        const assignment = await this.assignmentRepository.findOne({
            where: { id: assignmentId },
            relations: ['site', 'template', 'template.items', 'submissions', 'submissions.photo'],
        });

        if (!assignment) {
            throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
        }

        const archive = require('archiver')('zip', {
            zlib: { level: 9 },
        });

        res.attachment(`${assignment.site.code}_${assignment.template.name}.zip`);
        archive.pipe(res);

        const path = require('path');
        const fs = require('fs');

        for (const item of assignment.template.items) {
            const folderName = item.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const submissions = assignment.submissions.filter(s => s.template_item_id === item.id);

            for (const sub of submissions) {
                if (sub.photo && sub.photo.name) {
                    // Assuming files are stored in ./files relative to cwd
                    const filePath = path.join(process.cwd(), 'files', sub.photo.name);
                    if (fs.existsSync(filePath)) {
                        archive.file(filePath, { name: `${folderName}/${sub.photo.name}` });
                    }
                }
            }
        }

        await archive.finalize();
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

    async generateDocument(generateDto: GenerateDocumentDto, file: any, res: any) {
        const assignment = await this.assignmentRepository.findOne({
            where: { id: generateDto.assignment_id },
            relations: ['site', 'template', 'template.items', 'submissions', 'submissions.photo'],
        });

        if (!assignment) {
            throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
        }

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

        const submissions = assignment.submissions;
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

                                if (submission && submission.photo && submission.photo.name) {
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
                                                const buffer = fs.readFileSync(photoPath);
                                                const dimensions = sizeOf(buffer);
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
                });
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${assignment.site.code}_Document.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    }
}
