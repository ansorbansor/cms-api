import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DistanceTracking } from './entities/distance-tracking.entity';
import { SyncDistanceTrackingDto } from './dto/sync-distance-tracking.dto';

@Injectable()
export class DistanceTrackingService {
  constructor(
    @InjectRepository(DistanceTracking)
    private distanceTrackingRepository: Repository<DistanceTracking>,
  ) {}

  async sync(userId: number, dto: SyncDistanceTrackingDto): Promise<void> {
    // Check if entry already exists for this user and date
    let tracking = await this.distanceTrackingRepository.findOne({
      where: { userId, date: dto.date },
    });

    if (tracking) {
      // Update existing
      tracking.totalDistance = dto.totalDistance;
      tracking.mockAttempts = dto.mockAttempts;
      tracking.maxSpeed = dto.maxSpeed;
    } else {
      // Create new
      tracking = this.distanceTrackingRepository.create({
        userId,
        date: dto.date,
        totalDistance: dto.totalDistance,
        mockAttempts: dto.mockAttempts,
        maxSpeed: dto.maxSpeed,
      });
    }

    await this.distanceTrackingRepository.save(tracking);
  }
}
