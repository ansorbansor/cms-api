import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ParseArrayPipe,
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
    @Body(new ParseArrayPipe({ items: SyncDistanceTrackingDto })) syncDtos: SyncDistanceTrackingDto[],
  ) {
    await this.distanceTrackingService.sync(req.user.id, syncDtos);
    return {
      success: true,
      message: 'Distance tracking data synced successfully',
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req) {
    const date = req.query.date;
    const data = await this.distanceTrackingService.findAll(date);
    return {
      success: true,
      data,
    };
  }
}
