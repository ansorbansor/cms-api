import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import { MenuPermission } from 'src/utils/enums';
import { Controllers, Permissions } from 'src/utils/decorator';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { successResponse, successResponseList } from 'src/utils/responses';

@ApiBearerAuth()
@ApiTags('Topics')
@Controller({
  path: 'topics',
  version: '1',
})
export class TopicsController {
  constructor(private readonly topicService: TopicsService) {}

  @Post()
  @Permissions(MenuPermission.CREATE)
  @Controllers(TopicsController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTopicDto: CreateTopicDto) {
    return successResponse(
      await this.topicService.create(createTopicDto),
      'success',
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return successResponseList(
      await this.topicService.findManyWithPagination({
        page,
        limit,
        total: 0,
      }),
      'success',
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return successResponse(
      await this.topicService.findOne({ id: +id }),
      'success',
    );
  }

  @Patch()
  @Permissions(MenuPermission.UPDATE)
  @Controllers(TopicsController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async update(@Body() updateTopicDto: UpdateTopicDto) {
    return successResponse(
      await this.topicService.update(updateTopicDto),
      'success',
    );
  }

  @Delete(':id')
  @Permissions(MenuPermission.DELETE)
  @Controllers(TopicsController.name)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id') id: number) {
    return successResponse(await this.topicService.softDelete(id), 'success');
  }
}
