import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/utils/guards';
import { DistanceTrackingService } from './distance-tracking.service';
import { SyncDistanceTrackingDto } from './dto/sync-distance-tracking.dto';

@ApiBearerAuth()
@ApiTags('Distance Tracking')
@Controller({
  path: 'distance-tracking',
  version: '1',
})
export class DistanceTrackingController {
  constructor(private readonly distanceTrackingService: DistanceTrackingService) {}

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sync(
    @Request() req,
    @Body() syncDto: SyncDistanceTrackingDto,
  ) {
    await this.distanceTrackingService.sync(req.user.id, syncDto);
    return {
      success: true,
      message: 'Distance tracking data synced successfully',
    };
  }
}
