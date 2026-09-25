import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from '../../entities/material.entity';
import { MaterialTransaction } from '../../entities/material-transaction.entity';
import { CreateMaterialDTO, CreateMaterialTransactionDTO } from './dto/create-material.dto';
import { UpdateMaterialDTO } from './dto/update-material.dto';
import * as xlsx from 'xlsx';
import * as async from 'async';
import * as fs from 'fs';
import { ExportJob } from '../../entities/export-job.entity';

@Injectable()
export class MaterialsService {
  private importQueue: async.QueueObject<any>;

  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(MaterialTransaction)
    private readonly transactionRepository: Repository<MaterialTransaction>,
    @InjectRepository(ExportJob)
    private exportJobRepository: Repository<ExportJob>,
  ) {
    this.importQueue = async.queue(async (task, callback) => {
      try {
        await this.processImportJob(task);
        callback();
      } catch (err) {
        callback(err);
      }
    }, 1);
  }

  async create(createDto: CreateMaterialDTO, userId?: number): Promise<Material> {
    if (!createDto.serial_number) {
      const timestamp = new Date().getTime().toString().slice(-6);
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      createDto.serial_number = `SN-${timestamp}-${randomStr}`;
    }
    const material = this.materialRepository.create(createDto);
    const saved = await this.materialRepository.save(material);
    
    if (userId) {
        const transaction = this.transactionRepository.create({
          material_id: saved.id,
          transaction_type: 'CREATE',
          quantity: saved.quantity,
          site_id: saved.site_id,
          notes: `Material Created`,
          performed_by: userId,
        });
        await this.transactionRepository.save(transaction);
    }
    return saved;
  }

  async importExcel(file: any, userId: number) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const job = new ExportJob();
    job.user_id = userId;
    job.type = 'IMPORT_MATERIALS';
    job.payload = JSON.stringify({ originalname: file.originalname });
    job.status = 'PENDING';
    job.file_path = file.path;
    await this.exportJobRepository.save(job);

    this.importQueue.push(job.id);

    return { job_id: job.id };
  }

  private async processImportJob(jobId: string) {
    const job = await this.exportJobRepository.findOne(jobId);
    if (!job) return;

    job.status = 'PROCESSING';
    await this.exportJobRepository.save(job);

    try {
      const fileBuffer = fs.readFileSync(job.file_path);
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data: any[] = xlsx.utils.sheet_to_json(sheet);

      let success = 0;
      let failed = 0;
      let errorDetails: string[] = [];

      const validCategories = [
        'Active Equipment (Antenna, Board, IDU, SFP, Electronic material, etc)',
        'Passive Material (Mounting, Boom, Bracket, etc)',
        'Consumables (Power Cable, Coaxial Cable, LAN Cable, etc)',
        'Accessories (Clamp, Nut, Screw, etc)'
      ];
      const validSourceTypes = ['Purchased', 'Customer Supplied'];
      const validStatuses = ['In Warehouse', 'On Delivery', 'Delivered', 'Return Delivery', 'Faulty'];
      const validConditions = ['Tested and Worked', 'Not Yet Tested', 'Tested and Faulty'];

      const { getManager } = require('typeorm');
      const manager = getManager();
      const regionsDb = await manager.query('SELECT name FROM regions');
      const validRegions = regionsDb.map((r: any) => r.name);
      
      const projectsDb = await manager.query('SELECT name FROM projects');
      const validProjects = projectsDb.map((p: any) => p.name);

      let rowIndex = 1;
      for (const row of data) {
        rowIndex++;
        try {
          const category = row['Category'] || 'Accessories (Clamp, Nut, Screw, etc)';
          const sourceType = row['Source Type'] || 'Purchased';
          const status = row['Status'] || 'In Warehouse';
          const condition = row['Condition'] || 'Tested and Worked';
          const region = row['Warehouse Region'];
          const project = row['Project'];

          if (!validCategories.includes(category)) throw new Error(`Invalid Category: "${category}"`);
          if (!validSourceTypes.includes(sourceType)) throw new Error(`Invalid Source Type: "${sourceType}"`);
          if (!validStatuses.includes(status)) throw new Error(`Invalid Status: "${status}"`);
          if (!validConditions.includes(condition)) throw new Error(`Invalid Condition: "${condition}"`);
          if (region && !validRegions.includes(region)) throw new Error(`Invalid Warehouse Region: "${region}"`);
          if (project && !validProjects.includes(project)) throw new Error(`Invalid Project: "${project}"`);

          const createDto: CreateMaterialDTO = {
            material_name: row['Material Name'],
            material_category: category,
            serial_number: row['Serial Number'] ? String(row['Serial Number']) : undefined,
            brand: row['Brand'],
            source_type: sourceType,
            owner_client: row['Customer / Owner'],
            status: status,
            warehouse_region: region,
            site_id: row['Site ID'],
            project_name: project,
            quantity: row['Quantity'] ? parseInt(row['Quantity']) : 1,
            unit: row['Unit'] || 'Units',
            delivery_reference: row['Delivery Reference'],
            condition: condition,
            notes: row['Notes'],
          };
          
          if (!createDto.serial_number) {
            const timestamp = new Date().getTime().toString().slice(-6);
            const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
            createDto.serial_number = `SN-${timestamp}-${randomStr}`;
          }
          
          if (!createDto.material_name || !createDto.brand) {
              failed++;
              continue;
          }

          const material = this.materialRepository.create(createDto);
          const saved = await this.materialRepository.save(material);
          
          if (job.user_id) {
              const transaction = this.transactionRepository.create({
                material_id: saved.id,
                transaction_type: 'IMPORT',
                quantity: saved.quantity,
                site_id: saved.site_id,
                notes: `Material Imported`,
                performed_by: job.user_id,
              });
              await this.transactionRepository.save(transaction);
          }

          success++;
        } catch (error) {
          failed++;
          errorDetails.push(`Row ${rowIndex}: ${error.message}`);
        }
      }

      job.status = 'COMPLETED';
      let msg = `Success: ${success}, Failed: ${failed}`;
      if (errorDetails.length > 0) {
        msg += `\n\nErrors:\n${errorDetails.join('\n')}`;
      }
      job.error_message = msg;
      await this.exportJobRepository.save(job);
    } catch (err) {
      job.status = 'FAILED';
      job.error_message = err.message || 'Unknown error occurred during import';
      await this.exportJobRepository.save(job);
    }
  }

  async findAll(page: number, limit: number, search: string, category: string, status: string) {
    const query = this.materialRepository.createQueryBuilder('material');

    if (search) {
      query.andWhere(
        '(material.material_name ILIKE :search OR material.serial_number ILIKE :search OR material.site_id ILIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    if (category) {
      query.andWhere('material.material_category = :category', { category });
    }
    
    if (status) {
      query.andWhere('material.status = :status', { status });
    }

    if (limit > 0) {
      query.skip((page - 1) * limit).take(limit);
    }

    const [data, total] = await query.orderBy('material.id', 'DESC').getManyAndCount();

    const materialIds = data.map(m => m.id);
    if (materialIds.length > 0) {
      const deployments = await this.transactionRepository
        .createQueryBuilder('tx')
        .select('tx.material_id', 'material_id')
        .addSelect('tx.site_id', 'site_id')
        .addSelect("SUM(CASE WHEN tx.transaction_type = 'OUT' THEN tx.quantity WHEN tx.transaction_type = 'IN' THEN -tx.quantity ELSE 0 END)", 'total_deployed')
        .addSelect(`(
          SELECT t2.transaction_type 
          FROM material_transactions t2 
          WHERE t2.material_id = tx.material_id AND t2.site_id = tx.site_id 
            AND t2.transaction_type IN ('OUT', 'CONFIRM_DEPLOY')
          ORDER BY t2.created_at DESC LIMIT 1
        )`, 'latest_status')
        .where('tx.material_id IN (:...materialIds)', { materialIds })
        .andWhere('tx.transaction_type IN (:...types)', { types: ['OUT', 'IN'] })
        .andWhere('tx.site_id IS NOT NULL')
        .andWhere("tx.site_id != ''")
        .groupBy('tx.material_id')
        .addGroupBy('tx.site_id')
        .having("SUM(CASE WHEN tx.transaction_type = 'OUT' THEN tx.quantity WHEN tx.transaction_type = 'IN' THEN -tx.quantity ELSE 0 END) > 0")
        .getRawMany();

      data.forEach(material => {
        const materialDeployments = deployments.filter(d => d.material_id === material.id);
        (material as any).deployments = materialDeployments.map(d => ({
           site_id: d.site_id,
           quantity: parseInt(d.total_deployed, 10),
           status: d.latest_status === 'CONFIRM_DEPLOY' ? 'Delivered' : 'On Delivery'
        }));
      });
    }

    return { data, total, page, limit };
  }

  async findBySerial(serial_number: string): Promise<Material> {
    const material = await this.materialRepository.findOne({ where: { serial_number } });
    if (!material) {
      throw new NotFoundException(`Material with serial ${serial_number} not found`);
    }
    return material;
  }

  async findOne(id: number): Promise<Material> {
    const material = await this.materialRepository.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException(`Material #${id} not found`);
    }
    return material;
  }

  async update(id: number, updateDto: UpdateMaterialDTO, userId?: number): Promise<Material> {
    const material = await this.findOne(id);
    
    const changes: string[] = [];
    for (const key of Object.keys(updateDto)) {
        if (updateDto[key] !== undefined && String(material[key]) !== String(updateDto[key])) {
            changes.push(`${key} changed to '${updateDto[key]}'`);
        }
    }

    this.materialRepository.merge(material, updateDto);
    const saved = await this.materialRepository.save(material);

    if (changes.length > 0 && userId) {
        const transaction = this.transactionRepository.create({
          material_id: id,
          transaction_type: 'UPDATE_INFO',
          quantity: 0,
          site_id: material.site_id,
          notes: `Updated: ${changes.join(', ')}`,
          performed_by: userId,
        });
        await this.transactionRepository.save(transaction);
    }

    return saved;
  }

  async softDelete(id: number): Promise<void> {
    await this.materialRepository.softDelete(id);
  }

  async addTransaction(materialId: number, dto: CreateMaterialTransactionDTO, userId: number) {
    const material = await this.findOne(materialId);
    
    if (dto.transaction_type === 'OUT' && material.quantity < dto.quantity) {
      throw new BadRequestException('Insufficient quantity for deduction');
    }

    const isReturn = dto.transaction_type === 'IN' && material.status === 'Delivered';
    const sourceSite = isReturn ? material.site_id : dto.site_id; // Store the site it came from for returns

    const transaction = this.transactionRepository.create({
      material_id: materialId,
      transaction_type: dto.transaction_type,
      quantity: dto.quantity,
      site_id: sourceSite,
      notes: dto.notes,
      receiver_name: dto.receiver_name,
      performed_by: userId,
    });

    await this.transactionRepository.save(transaction);

    if (dto.transaction_type === 'IN') {
      material.quantity += dto.quantity;
      if (material.status === 'Delivered') {
        material.status = 'Return Delivery';
        if (dto.site_id) {
            material.warehouse_region = dto.site_id; // Update warehouse destination
        }
      }
    } else if (dto.transaction_type === 'OUT') {
      material.quantity -= dto.quantity;
      material.status = 'On Delivery';
      if (dto.site_id) {
        material.site_id = dto.site_id;
      }
    }

    await this.materialRepository.save(material);

    return transaction;
  }

  async getHistory(materialId: number) {
    const material = await this.findOne(materialId); // ensure it exists
    return await this.transactionRepository.find({
      where: { material_id: materialId },
      relations: ['user'], // to get 'performed_by' user details
      order: { created_at: 'DESC' }
    });
  }

  async confirmDelivery(materialId: number, userId: number, siteId?: string) {
    const material = await this.findOne(materialId);

    let isReturn = material.status === 'Return Delivery';
    let isGoingToWarehouse = isReturn;
    let confirmSiteId = material.site_id;

    if (siteId) {
        confirmSiteId = siteId;
        isGoingToWarehouse = false;
        // Don't modify material global status aggressively if it's just for one site
        if (material.status === 'On Delivery' && material.quantity > 0) {
            material.status = 'In Warehouse';
        }
        await this.materialRepository.save(material);
    } else {
        if (material.status !== 'On Delivery' && material.status !== 'Return Delivery') {
          throw new BadRequestException('Material is not currently on delivery');
        }

        isGoingToWarehouse = isReturn || !material.site_id;

        // Update material status
        if (isGoingToWarehouse) {
          material.status = 'In Warehouse';
          material.site_id = null;
        } else if (material.quantity > 0) {
          // Consumable: still has stock in warehouse, confirm delivery but go back to In Warehouse
          material.status = 'In Warehouse';
        } else {
          material.status = 'Delivered';
        }

        await this.materialRepository.save(material);
    }

    // Create confirmation log
    const transaction = this.transactionRepository.create({
      material_id: materialId,
      transaction_type: isGoingToWarehouse ? 'CONFIRM_RETURN' : 'CONFIRM_DEPLOY',
      quantity: 0, // No quantity change
      site_id: confirmSiteId,
      notes: `Confirmed arrival ${isGoingToWarehouse ? 'to Warehouse' : 'at Site'}`,
      performed_by: userId,
    });

    await this.transactionRepository.save(transaction);
    return material;
  }

  async getSummary() {
    const qb = this.materialRepository.createQueryBuilder('material');
    const total = await qb.select('COUNT(material.id)', 'count').getRawOne();
    const inWarehouse = await qb.where('material.status = :status', { status: 'In Warehouse' }).select('COUNT(material.id)', 'count').getRawOne();
    const installed = await qb.where('material.status = :status', { status: 'Delivered' }).select('COUNT(material.id)', 'count').getRawOne();
    const onShipping = await qb.where('material.status IN (:...statuses)', { statuses: ['On Shipping', 'On Delivery', 'Return Delivery'] }).select('COUNT(material.id)', 'count').getRawOne();
    const faulty = await qb.where('material.status IN (:...statuses) OR material.condition = :condition', { statuses: ['Faulty', 'Faulty / RMA', 'Faulty/RMA'], condition: 'Tested and Faulty' }).select('COUNT(material.id)', 'count').getRawOne();

    return {
      total: parseInt(total?.count || '0', 10),
      inWarehouse: parseInt(inWarehouse?.count || '0', 10),
      installed: parseInt(installed?.count || '0', 10),
      onShipping: parseInt(onShipping?.count || '0', 10),
      faulty: parseInt(faulty?.count || '0', 10),
    };
  }
}
