import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TargetCard } from '../../entities/target-card.entity';
import { successResponse, failedResponse } from '../../utils/responses';
import { HttpStatus } from '@nestjs/common';

@Injectable()
export class TargetCardsService {
  constructor(
    @InjectRepository(TargetCard)
    private readonly targetCardRepo: Repository<TargetCard>,
  ) {}

  async create(createTargetCardDto: any) {
    try {
      const card = this.targetCardRepo.create({
        title: createTargetCardDto.title,
        items: createTargetCardDto.items,
        start_date: createTargetCardDto.start_date,
        end_date: createTargetCardDto.end_date
      });
      const saved = await this.targetCardRepo.save(card);
      return successResponse(saved, 'Successfully created target card');
    } catch (err) {
      console.error(err);
      throw failedResponse(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to create target card');
    }
  }

  async findAll() {
    try {
      const cards = await this.targetCardRepo.find({
        order: { id: 'ASC' }
      });
      return successResponse(cards, 'Successfully fetched target cards');
    } catch (err) {
      console.error(err);
      throw failedResponse(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch target cards');
    }
  }

  async remove(id: number) {
    try {
      await this.targetCardRepo.delete(id);
      return successResponse(null, 'Successfully deleted target card');
    } catch (err) {
      console.error(err);
      throw failedResponse(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete target card');
    }
  }
}
