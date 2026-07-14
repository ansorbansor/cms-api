import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { DistanceTracking } from './entities/distance-tracking.entity';
import { SyncDistanceTrackingDto } from './dto/sync-distance-tracking.dto';

@Injectable()
export class DistanceTrackingService {
  constructor(
    @InjectRepository(DistanceTracking)
    private distanceTrackingRepository: Repository<DistanceTracking>,
  ) {}

  async sync(userId: number, dtos: SyncDistanceTrackingDto[]): Promise<void> {
    if (!dtos || dtos.length === 0) return;

    for (const dto of dtos) {
      let tracking = await this.distanceTrackingRepository.findOne({
        where: { userId, date: dto.date, startTripTime: dto.startTripTime },
      });

      if (tracking) {
        tracking.totalDistance = dto.totalDistance;
        tracking.mockAttempts = dto.mockAttempts;
        tracking.maxSpeed = dto.maxSpeed;
        tracking.endTripTime = dto.endTripTime;
        tracking.endLat = dto.endLat;
        tracking.endLng = dto.endLng;
      } else {
        tracking = this.distanceTrackingRepository.create({
          userId,
          date: dto.date,
          startTripTime: dto.startTripTime,
          endTripTime: dto.endTripTime,
          startLat: dto.startLat,
          startLng: dto.startLng,
          endLat: dto.endLat,
          endLng: dto.endLng,
          totalDistance: dto.totalDistance,
          mockAttempts: dto.mockAttempts,
          maxSpeed: dto.maxSpeed,
        });
      }

      await this.distanceTrackingRepository.save(tracking);
    }
  }

  async findAll(startDate?: string, endDate?: string, searchName?: string): Promise<DistanceTracking[]> {
    const query: any = {};
    if (startDate && endDate) {
      query.date = Between(startDate, endDate);
    } else if (startDate) {
      query.date = MoreThanOrEqual(startDate);
    } else if (endDate) {
      query.date = LessThanOrEqual(endDate);
    }
    
    let whereClause: any = query;
    if (searchName) {
      whereClause = [
         { ...query, user: { name: ILike(`%${searchName}%`) } },
         { ...query, user: { email: ILike(`%${searchName}%`) } }
      ]
    }

    return this.distanceTrackingRepository.find({
      where: whereClause,
      relations: ['user'],
      order: {
        date: 'DESC',
        startTripTime: 'DESC',
      },
    });
  }
}
