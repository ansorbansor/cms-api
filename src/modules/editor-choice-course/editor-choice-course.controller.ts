import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  ParseArrayPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/utils/guards';
import { MenuPermission } from 'src/utils/enums';
import { Controllers, Permissions } from 'src/utils/decorator';
import { successResponse, successResponseList } from 'src/utils/responses';
import { EditorChoiceCourseService } from './editor-choice-course.service';
import { CreateEditorChoiceCourseDto } from './dto/create-editor-choice-course.dto';
import { validationArrayOptions } from 'src/utils/validation-options';

@ApiBearerAuth()
@ApiTags('Editor Choice Course')
@Controller({
  version: '1',
})
export class EditorChoiceCourseController {
  constructor(private readonly editorChoiceCourse: EditorChoiceCourseService) {}

  @Post('editor-choice-course')
  @Permissions(MenuPermission.CREATE)
  @Controllers(EditorChoiceCourseController.name)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(
      new ParseArrayPipe({
        items: CreateEditorChoiceCourseDto,
        ...validationArrayOptions,
      }),
    )
    createEditorChoiceCourseDto: CreateEditorChoiceCourseDto[],
    @Request() req,
  ) {
    return successResponse(
      await this.editorChoiceCourse.create(
        createEditorChoiceCourseDto,
        req.user,
      ),
      'success',
    );
  }

  @Get('editor-choice-course')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return successResponseList(
      await this.editorChoiceCourse.findManyWithPagination({
        page,
        limit,
        total: 0,
      }),
      'success',
    );
  }
}
