import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import * as crypto from 'crypto';
import { AtpTemplate } from '../../entities/atp-template.entity';
import { AtpTemplateSection } from '../../entities/atp-template-section.entity';
import { AtpTemplateItem } from '../../entities/atp-template-item.entity';
import { AtpDocument } from '../../entities/atp-document.entity';
import { AtpDocumentValue } from '../../entities/atp-document-value.entity';
import { AtpDocumentReview } from '../../entities/atp-document-review.entity';
import { SiteTakeDataAssignment } from '../../entities/site-take-data-assignment.entity';
import { TakeDataSubmission } from '../../entities/take-data-submission.entity';
import { CreateAtpTemplateDto, CreateAtpSectionDto, CreateAtpItemDto } from './dto/template.dto';
import { CreateAtpDocumentDto, SaveAtpValuesDto, SubmitAtpReviewDto } from './dto/document.dto';

@Injectable()
export class AtpService {
  constructor(
    @InjectRepository(AtpTemplate)
    private readonly templateRepo: Repository<AtpTemplate>,
    @InjectRepository(AtpTemplateSection)
    private readonly sectionRepo: Repository<AtpTemplateSection>,
    @InjectRepository(AtpTemplateItem)
    private readonly itemRepo: Repository<AtpTemplateItem>,
    @InjectRepository(AtpDocument)
    private readonly documentRepo: Repository<AtpDocument>,
    @InjectRepository(AtpDocumentValue)
    private readonly valueRepo: Repository<AtpDocumentValue>,
    @InjectRepository(AtpDocumentReview)
    private readonly reviewRepo: Repository<AtpDocumentReview>,
    @InjectRepository(SiteTakeDataAssignment)
    private readonly takeDataAssignmentRepo: Repository<SiteTakeDataAssignment>,
    @InjectRepository(TakeDataSubmission)
    private readonly takeDataSubmissionRepo: Repository<TakeDataSubmission>,
  ) {}

  // ==========================================
  // TEMPLATE MANAGEMENT
  // ==========================================

  async getTemplates() {
    return this.templateRepo.find({
      relations: ['project', 'customer', 'sections', 'sections.items'],
      order: { created_at: 'DESC' },
    });
  }

  async getTemplateById(id: number) {
    const template = await this.templateRepo.findOne({
      where: { id },
      relations: [
        'project',
        'customer',
        'sections',
        'sections.items',
        'sections.items.take_data_template_item',
        'sections.items.take_data_template_item.template',
      ],
    });

    if (!template) {
      throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
    }

    if (template.sections) {
      template.sections.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      template.sections.forEach((s) => {
        if (s.items) {
          s.items.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        }
      });
    }

    return template;
  }

  async createTemplate(dto: CreateAtpTemplateDto, userId?: number) {
    const template = this.templateRepo.create({
      ...dto,
      created_by: userId,
    });
    return this.templateRepo.save(template);
  }

  async updateTemplate(id: number, dto: Partial<CreateAtpTemplateDto>) {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
    Object.assign(template, dto);
    return this.templateRepo.save(template);
  }

  async deleteTemplate(id: number) {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
    await this.templateRepo.remove(template);
    return { success: true, message: 'Template deleted successfully' };
  }

  async duplicateTemplate(id: number, userId?: number, customName?: string) {
    const source = await this.templateRepo.findOne({
      where: { id },
      relations: ['sections', 'sections.items'],
    });

    if (!source) throw new HttpException('Template not found', HttpStatus.NOT_FOUND);

    // 1. Create duplicate template record
    const newTemplate = this.templateRepo.create({
      name: customName?.trim() || `${source.name} (Copy)`,
      description: source.description,
      project_id: source.project_id,
      customer_id: source.customer_id,
      structure_type: source.structure_type,
      version: source.version,
      is_active: true,
      created_by: userId,
    });

    const savedTemplate = await this.templateRepo.save(newTemplate);

    // 2. Clone sections and items
    if (source.sections && source.sections.length > 0) {
      const sortedSections = [...source.sections].sort(
        (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
      );

      for (const sec of sortedSections) {
        const newSec = this.sectionRepo.create({
          template_id: savedTemplate.id,
          title: sec.title,
          section_key: sec.section_key,
          section_type: sec.section_type,
          order_index: sec.order_index,
          description: sec.description,
        });
        const savedSec = await this.sectionRepo.save(newSec);

        if (sec.items && sec.items.length > 0) {
          const sortedItems = [...sec.items].sort(
            (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
          );

          const itemsToClone = sortedItems.map((it) =>
            this.itemRepo.create({
              section_id: savedSec.id,
              item_no: it.item_no,
              picture_no: it.picture_no,
              label: it.label,
              description: it.description,
              item_type: it.item_type,
              severity: it.severity,
              options: it.options,
              take_data_tag: it.take_data_tag,
              take_data_template_item_id: it.take_data_template_item_id,
              order_index: it.order_index,
            }),
          );

          await this.itemRepo.save(itemsToClone);
        }
      }
    }

    return this.getTemplateById(savedTemplate.id);
  }

  async createSection(templateId: number, dto: CreateAtpSectionDto) {
    const template = await this.templateRepo.findOne({ where: { id: templateId } });
    if (!template) throw new HttpException('Template not found', HttpStatus.NOT_FOUND);

    const section = this.sectionRepo.create({
      ...dto,
      template_id: templateId,
    });
    return this.sectionRepo.save(section);
  }

  async updateSection(sectionId: number, dto: Partial<CreateAtpSectionDto>) {
    const section = await this.sectionRepo.findOne({ where: { id: sectionId } });
    if (!section) throw new HttpException('Section not found', HttpStatus.NOT_FOUND);
    Object.assign(section, dto);
    return this.sectionRepo.save(section);
  }

  async deleteSection(sectionId: number) {
    const section = await this.sectionRepo.findOne({ where: { id: sectionId } });
    if (!section) throw new HttpException('Section not found', HttpStatus.NOT_FOUND);
    await this.sectionRepo.remove(section);
    return { success: true, message: 'Section deleted' };
  }

  async createItem(sectionId: number, dto: CreateAtpItemDto) {
    const section = await this.sectionRepo.findOne({ where: { id: sectionId } });
    if (!section) throw new HttpException('Section not found', HttpStatus.NOT_FOUND);

    const item = this.itemRepo.create({
      ...dto,
      section_id: sectionId,
    });
    return this.itemRepo.save(item);
  }

  async updateItem(itemId: number, dto: Partial<CreateAtpItemDto>) {
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new HttpException('Item not found', HttpStatus.NOT_FOUND);
    if (dto.take_data_template_item_id === null) {
      item.take_data_template_item_id = null;
      item.take_data_template_item = null;
    }
    Object.assign(item, dto);
    return this.itemRepo.save(item);
  }

  async deleteItem(itemId: number) {
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new HttpException('Item not found', HttpStatus.NOT_FOUND);
    await this.itemRepo.remove(item);
    return { success: true, message: 'Item deleted' };
  }

  // ==========================================
  // DOCUMENT MANAGEMENT (DOCUMENT TEAM)
  // ==========================================

  async getDocuments(page = 1, limit = 15, search?: string, status?: string, projectId?: number) {
    const qb = this.documentRepo
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.template', 'template')
      .leftJoinAndSelect('doc.project', 'project')
      .leftJoinAndSelect('doc.customer', 'customer')
      .leftJoinAndSelect('doc.site_ne', 'site_ne')
      .leftJoinAndSelect('doc.site_fe', 'site_fe')
      .leftJoinAndSelect('doc.creator', 'creator')
      .orderBy('doc.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search && search.trim() !== '') {
      const q = `%${search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(doc.doc_number) LIKE :q OR LOWER(doc.link_id) LIKE :q OR LOWER(doc.link_name) LIKE :q OR LOWER(site_ne.name) LIKE :q OR LOWER(site_fe.name) LIKE :q)',
        { q },
      );
    }

    if (status && status !== 'all') {
      qb.andWhere('doc.status = :status', { status });
    }

    if (projectId) {
      qb.andWhere('doc.project_id = :projectId', { projectId });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDocumentById(id: number) {
    const doc = await this.documentRepo.findOne({
      where: { id },
      relations: [
        'template',
        'template.sections',
        'template.sections.items',
        'project',
        'customer',
        'site_ne',
        'site_fe',
        'creator',
        'values',
        'values.template_item',
        'values.photo',
        'reviews',
      ],
    });

    if (!doc) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    if (doc.template?.sections) {
      doc.template.sections.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      doc.template.sections.forEach((s) => {
        if (s.items) {
          s.items.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        }
      });
    }

    return doc;
  }

  async getDocumentByShareToken(token: string) {
    const doc = await this.documentRepo.findOne({
      where: { share_token: token },
      relations: [
        'template',
        'template.sections',
        'template.sections.items',
        'project',
        'customer',
        'site_ne',
        'site_fe',
        'creator',
        'values',
        'values.template_item',
        'values.photo',
        'reviews',
      ],
    });

    if (!doc) {
      throw new HttpException('ATP Document not found or link has expired', HttpStatus.NOT_FOUND);
    }

    if (doc.template?.sections) {
      doc.template.sections.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      doc.template.sections.forEach((s) => {
        if (s.items) {
          s.items.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        }
      });
    }

    return doc;
  }

  async createDocument(dto: CreateAtpDocumentDto, userId?: number) {
    const template = await this.templateRepo.findOne({
      where: { id: dto.template_id },
      relations: ['sections', 'sections.items'],
    });

    if (!template) {
      throw new HttpException('Template not found', HttpStatus.BAD_REQUEST);
    }

    // Generate unique doc_number: ATP-YYYYMM-XXXX
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await this.documentRepo.count();
    const docNumber = `ATP-${dateStr}-${String(count + 1).padStart(4, '0')}`;
    const shareToken = crypto.randomBytes(16).toString('hex');

    const doc = this.documentRepo.create({
      ...dto,
      doc_number: docNumber,
      share_token: shareToken,
      status: 'DRAFT',
      created_by: userId,
    });

    const savedDoc = await this.documentRepo.save(doc);

    // Initialize default value records for all template items
    const initialValues: AtpDocumentValue[] = [];
    if (template.sections) {
      for (const sec of template.sections) {
        if (sec.items) {
          for (const item of sec.items) {
            initialValues.push(
              this.valueRepo.create({
                document_id: savedDoc.id,
                template_item_id: item.id,
                test_result: item.item_type === 'checklist_pass_fail' ? 'Pass' : null,
              }),
            );
          }
        }
      }
    }

    if (initialValues.length > 0) {
      await this.valueRepo.save(initialValues);
    }

    return this.getDocumentById(savedDoc.id);
  }

  async updateDocument(id: number, dto: Partial<CreateAtpDocumentDto>) {
    const doc = await this.documentRepo.findOne({ where: { id } });
    if (!doc) throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    Object.assign(doc, dto);
    return this.documentRepo.save(doc);
  }

  async saveDocumentValues(documentId: number, dto: SaveAtpValuesDto, userId?: number) {
    const doc = await this.documentRepo.findOne({
      where: { id: documentId },
      relations: ['template', 'template.sections', 'template.sections.items'],
    });
    if (!doc) throw new HttpException('Document not found', HttpStatus.NOT_FOUND);

    // Upsert values
    let majorCount = 0;
    let minorCount = 0;
    let criticalCount = 0;
    const punchlistItems: any[] = [];

    // Map existing values
    const existingValues = await this.valueRepo.find({ where: { document_id: documentId } });
    const valMap = new Map<number, AtpDocumentValue>();
    existingValues.forEach((v) => valMap.set(v.template_item_id, v));

    // Get all items to check severity
    const allItems = new Map<number, AtpTemplateItem>();
    doc.template?.sections?.forEach((s) => {
      s.items?.forEach((it) => allItems.set(it.id, it));
    });

    const toSave: AtpDocumentValue[] = [];

    for (const valDto of dto.values) {
      let record = valMap.get(valDto.template_item_id);
      if (!record) {
        record = this.valueRepo.create({
          document_id: documentId,
          template_item_id: valDto.template_item_id,
        });
      }

      if (valDto.text_value !== undefined) record.text_value = valDto.text_value;
      if (valDto.test_result !== undefined) record.test_result = valDto.test_result;
      if (valDto.photo_id !== undefined) record.photo_id = valDto.photo_id;
      if (valDto.photo_url !== undefined) record.photo_url = valDto.photo_url;
      if (valDto.take_data_submission_id !== undefined)
        record.take_data_submission_id = valDto.take_data_submission_id;
      if (valDto.remarks !== undefined) record.remarks = valDto.remarks;

      toSave.push(record);

      // Punchlist calculation
      if (record.test_result === 'Reject') {
        const itemMeta = allItems.get(record.template_item_id);
        const sev = itemMeta?.severity || 'Minor';
        if (sev === 'Critical') criticalCount++;
        else if (sev === 'Major') majorCount++;
        else minorCount++;

        punchlistItems.push({
          item_id: record.template_item_id,
          item_no: itemMeta?.item_no,
          label: itemMeta?.label,
          severity: sev,
          remarks: record.remarks,
        });
      }
    }

    if (toSave.length > 0) {
      await this.valueRepo.save(toSave);
    }

    // Update document summary
    doc.punchlist_summary = {
      critical_count: criticalCount,
      major_count: majorCount,
      minor_count: minorCount,
      total_punchlist: criticalCount + majorCount + minorCount,
      items: punchlistItems,
    };

    if (criticalCount > 0) {
      doc.acceptance_status = 'REJECT';
    } else if (majorCount > 0 || minorCount > 0) {
      doc.acceptance_status = 'PASS WITH PUNCHLIST';
    } else {
      doc.acceptance_status = 'PASS';
    }

    if (dto.status) {
      doc.status = dto.status;
    }

    await this.documentRepo.save(doc);

    return {
      success: true,
      acceptance_status: doc.acceptance_status,
      punchlist_summary: doc.punchlist_summary,
    };
  }

  // ==========================================
  // AUTO-FETCH PHOTOS FROM TAKE DATA
  // ==========================================

  async autoFetchPhotosFromTakeData(documentId: number) {
    const doc = await this.documentRepo.findOne({
      where: { id: documentId },
      relations: ['template', 'template.sections', 'template.sections.items'],
    });

    if (!doc) throw new HttpException('Document not found', HttpStatus.NOT_FOUND);

    const siteIds = [doc.site_id_ne, doc.site_id_fe].filter(Boolean);
    if (siteIds.length === 0) {
      return {
        success: false,
        matched_count: 0,
        message: 'Dokumen ini belum memiliki Site NE atau FE terdaftar.',
      };
    }

    // Find assignments for these sites
    const assignments = await this.takeDataAssignmentRepo.find({
      where: { site_id: In(siteIds) },
      relations: ['submissions', 'submissions.photo', 'submissions.template_item'],
    });

    if (assignments.length === 0) {
      return {
        success: false,
        matched_count: 0,
        message: 'Tidak ditemukan penugasan Take Data untuk site terkait.',
      };
    }

    // Collect all valid submissions (photos and/or text_data)
    const allSubmissions: TakeDataSubmission[] = [];
    assignments.forEach((a) => {
      if (a.submissions) {
        a.submissions.forEach((sub) => {
          if (sub.photo || sub.photo_id || sub.text_data) {
            allSubmissions.push(sub);
          }
        });
      }
    });

    if (allSubmissions.length === 0) {
      return {
        success: false,
        matched_count: 0,
        message: 'Belum ada foto atau data teknis yang disubmit pada modul Take Data untuk site ini.',
      };
    }

    // Collect all candidate template items (photo, text, or any item with take_data link/tag)
    const candidateItems: AtpTemplateItem[] = [];
    doc.template?.sections?.forEach((sec) => {
      sec.items?.forEach((it) => {
        if (
          it.item_type === 'photo' ||
          it.item_type === 'text' ||
          it.take_data_template_item_id ||
          it.take_data_tag
        ) {
          candidateItems.push(it);
        }
      });
    });

    const existingValues = await this.valueRepo.find({ where: { document_id: documentId } });
    const valMap = new Map<number, AtpDocumentValue>();
    existingValues.forEach((v) => valMap.set(v.template_item_id, v));

    let matchedCount = 0;
    const toSave: AtpDocumentValue[] = [];

    for (const item of candidateItems) {
      // 1. Direct ID match (Prioritas 1: Jika di-link langsung ke Template Item Take Data)
      let match = null;
      if (item.take_data_template_item_id) {
        match = allSubmissions.find(
          (sub) => sub.template_item_id === item.take_data_template_item_id,
        );
      }

      // 2. Fuzzy match (Prioritas 2: Mencocokkan tag, label, atau picture_no)
      if (!match) {
        const tag = (item.take_data_tag || item.label || '').toLowerCase().trim();
        if (tag) {
          match = allSubmissions.find((sub) => {
            const subName = (sub.template_item?.name || '').toLowerCase();
            return (
              subName.includes(tag) ||
              tag.includes(subName) ||
              (item.picture_no && subName.includes(item.picture_no.toLowerCase()))
            );
          });
        }
      }

      if (match) {
        let record = valMap.get(item.id);
        if (!record) {
          record = this.valueRepo.create({
            document_id: documentId,
            template_item_id: item.id,
          });
        }

        let updated = false;

        // Populate photo if available
        if (match.photo || match.photo_id) {
          const photoName = match.photo?.name || match.photo?.path?.split('/')?.pop();
          const photoUrl = photoName ? `/files/${photoName}` : null;
          record.photo_id = match.photo_id;
          record.photo_url = photoUrl;
          updated = true;
        }

        // Populate text value if available and relevant (for text input, or if no photo)
        if (match.text_data && (item.item_type === 'text' || !match.photo_id)) {
          record.text_value = match.text_data;
          updated = true;
        }

        if (updated) {
          record.take_data_submission_id = match.id;
          toSave.push(record);
          matchedCount++;
        }
      }
    }

    if (toSave.length > 0) {
      await this.valueRepo.save(toSave);
    }

    return {
      success: true,
      matched_count: matchedCount,
      total_candidate_slots: candidateItems.length,
      message: `Berhasil mencocokkan dan menyematkan ${matchedCount} data (foto & isian teknis) dari Take Data!`,
    };
  }

  async getTakeDataPhotos(documentId: number) {
    const doc = await this.documentRepo.findOne({
      where: { id: documentId },
      relations: ['site_ne', 'site_fe'],
    });

    if (!doc) throw new HttpException('Document not found', HttpStatus.NOT_FOUND);

    const siteIds = [doc.site_id_ne, doc.site_id_fe].filter(Boolean);
    if (siteIds.length === 0) return [];

    const assignments = await this.takeDataAssignmentRepo.find({
      where: { site_id: In(siteIds) },
      relations: ['site', 'submissions', 'submissions.photo', 'submissions.template_item'],
    });

    const photos: any[] = [];
    assignments.forEach((a) => {
      if (a.submissions) {
        a.submissions.forEach((sub) => {
          if (sub.photo || sub.photo_id) {
            const fileName = sub.photo?.name || sub.photo?.path?.split('/')?.pop();
            photos.push({
              submission_id: sub.id,
              photo_id: sub.photo_id,
              template_item_id: sub.template_item_id,
              photo_url: fileName ? `/files/${fileName}` : null,
              task_name: sub.template_item?.name || 'Foto Lapangan',
              site_code: a.site?.code,
              site_name: a.site?.name,
              coordinate: sub.coordinate,
              timestamp: sub.timestamp,
            });
          }
        });
      }
    });

    return photos;
  }

  // ==========================================
  // REVIEW & APPROVAL WORKFLOW
  // ==========================================

  async submitForReview(documentId: number, userId?: number) {
    const doc = await this.documentRepo.findOne({ where: { id: documentId } });
    if (!doc) throw new HttpException('Document not found', HttpStatus.NOT_FOUND);

    doc.status = 'INTERNAL_REVIEW';
    doc.submitted_at = new Date();
    await this.documentRepo.save(doc);

    return {
      success: true,
      message: 'Dokumen berhasil dikirimkan ke antrean Review.',
      status: doc.status,
    };
  }

  async submitReview(documentId: number, dto: SubmitAtpReviewDto, userId?: number) {
    const doc = await this.documentRepo.findOne({ where: { id: documentId } });
    if (!doc) throw new HttpException('Document not found', HttpStatus.NOT_FOUND);

    const review = this.reviewRepo.create({
      document_id: documentId,
      reviewer_role: dto.reviewer_role,
      pic_name: dto.pic_name,
      user_id: userId,
      status: dto.status,
      signature_url: dto.signature_url,
      remarks: dto.remarks,
      signed_at: new Date(),
    });

    await this.reviewRepo.save(review);

    // Update document status
    if (dto.status === 'APPROVED') {
      doc.status = 'APPROVED';
      doc.approved_at = new Date();
    } else if (dto.status === 'PUNCHLIST') {
      doc.status = 'PASS_WITH_PUNCHLIST';
    } else {
      doc.status = 'REVISE';
    }

    await this.documentRepo.save(doc);

    return {
      success: true,
      message: `Review berhasil dicatat (${dto.reviewer_role})`,
      document_status: doc.status,
    };
  }

  async deleteDocument(id: number) {
    const doc = await this.documentRepo.findOne({ where: { id } });
    if (!doc) throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    await this.documentRepo.remove(doc);
    return { success: true, message: 'Dokumen ATP berhasil dihapus' };
  }
}
