import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Request,
  Post,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/utils/guards';
import { successResponse, successResponseList } from 'src/utils/responses';
import { UserNotificationService } from './user-notification.service';
import { CreateUserNotificationDto } from './dto/create-user-notification.dto';
import { UserNotificationResource } from './resources/user-notification.resources';
import { UpdateUserNotificationTokenDto } from './dto/update-user-notification-token.dto';

@ApiBearerAuth()
@ApiTags('User Notification')
@Controller({
  path: 'notification',
  version: '1',
})
export class UserNotificationController {
  constructor(
    private readonly userNotificationService: UserNotificationService,
  ) {}

  @Post('venus-test')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserNotificationDto: CreateUserNotificationDto) {
    return successResponse(
      UserNotificationResource(
        await this.userNotificationService.create(createUserNotificationDto),
      ),
      'success',
    );
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async postUserNotificationToken(
    @Body() updateUserNotificationTokenDto: UpdateUserNotificationTokenDto,
    @Request() req,
  ) {
    await this.userNotificationService.postToken(
      req.user.id,
      updateUserNotificationTokenDto,
    );
    return successResponse(null, 'success');
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('source') source: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Request() req,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return successResponseList(
      await this.userNotificationService.findManyWithPagination({
        page,
        limit,
        total: 0,
        source: source,
        user_id: req.user.id,
      }),
      'success',
    );
  }

  @Patch(':notification_id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('notification_id') notificationId: number,
    @Request() req,
  ) {
    await this.userNotificationService.read(notificationId, req.user.id);
    return successResponse(null, 'success');
  }
}
