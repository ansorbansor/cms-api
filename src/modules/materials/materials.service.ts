import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from '../../entities/material.entity';
import { MaterialTransaction } from '../../entities/material-transaction.entity';
import { CreateMaterialDTO, CreateMaterialTransactionDTO } from './dto/create-material.dto';
import { UpdateMaterialDTO } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(MaterialTransaction)
    private readonly transactionRepository: Repository<MaterialTransaction>,
  ) {}

  async create(createDto: CreateMaterialDTO): Promise<Material> {
    const material = this.materialRepository.create(createDto);
    return await this.materialRepository.save(material);
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
           quantity: parseInt(d.total_deployed, 10)
        }));
      });
    }

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Material> {
    const material = await this.materialRepository.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException(`Material #${id} not found`);
    }
    return material;
  }

  async update(id: number, updateDto: UpdateMaterialDTO): Promise<Material> {
    const material = await this.findOne(id);
    this.materialRepository.merge(material, updateDto);
    return await this.materialRepository.save(material);
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

  async confirmDelivery(materialId: number, userId: number) {
    const material = await this.findOne(materialId);

    if (material.status !== 'On Delivery' && material.status !== 'Return Delivery') {
      throw new BadRequestException('Material is not currently on delivery');
    }

    const isReturn = material.status === 'Return Delivery';
    // Smart detection: if material has no site_id, it's heading to warehouse
    const isGoingToWarehouse = isReturn || !material.site_id;

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

    // Create confirmation log
    const transaction = this.transactionRepository.create({
      material_id: materialId,
      transaction_type: isGoingToWarehouse ? 'CONFIRM_RETURN' : 'CONFIRM_DEPLOY',
      quantity: 0, // No quantity change
      site_id: material.site_id,
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
