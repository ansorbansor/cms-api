import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { DocumentStorageEntity } from 'src/entities/document-storage.entity';
import { IPaginationOptions } from 'src/utils/types';

@Injectable()
export class DocumentStorageService {
  constructor(
    @InjectRepository(DocumentStorageEntity)
    private documentStorageRepository: Repository<DocumentStorageEntity>,
  ) {}

  async findAll(paginationOptions: IPaginationOptions, search?: string) {
    const page = paginationOptions.page || 1;
    const limit = paginationOptions.limit || 10;
    
    const whereCondition = search ? { title: ILike(`%${search}%`) } : {};

    const [data, total] = await this.documentStorageRepository.findAndCount({
      where: whereCondition,
      relations: ['user'],
      order: {
        created_at: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPage = Math.ceil(total / limit);

    return {
      data: data,
      totalData: total,
      currentPage: page,
      totalPage: totalPage,
    };
  }

  async create(title: string, file_url: string, user_id: number) {
    const document = this.documentStorageRepository.create({
      title,
      file_url,
      user_id,
    });
    return this.documentStorageRepository.save(document);
  }

  async delete(id: number) {
    const document = await this.documentStorageRepository.findOne({ where: { id } });
    if (!document) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }
    await this.documentStorageRepository.remove(document);
    return { success: true };
  }
}
