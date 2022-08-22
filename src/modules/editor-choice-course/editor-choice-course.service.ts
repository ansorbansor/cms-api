import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'src/utils/types';
import { getManager, Repository } from 'typeorm';
import { infinityPagination } from 'src/utils/responses';
import { EditorChoiceCourse } from 'src/entities/editor-choice-course.entity';
import { CreateEditorChoiceCourseDto } from './dto/create-editor-choice-course.dto';
import { User } from 'src/entities/user.entity';
import { EditorChoiceCourseResource } from './resources/editor-choice-course.resources';

@Injectable()
export class EditorChoiceCourseService {
  constructor(
    @InjectRepository(EditorChoiceCourse)
    private editorChoiceCourseRepository: Repository<EditorChoiceCourse>,
  ) {}

  async create(
    createEditorChoiceCourseDto: CreateEditorChoiceCourseDto[],
    user: User,
  ) {
    await getManager().query(
      'UPDATE editor_choice_courses SET deleted_at = NOW()',
    );

    const arrCourse = [];
    createEditorChoiceCourseDto.forEach((element) => {
      arrCourse.push({
        user_id: user.id,
        course_id: element.course_id,
        position: element.position,
      });
    });

    await this.editorChoiceCourseRepository.save(
      this.editorChoiceCourseRepository.create(arrCourse),
    );

    return this.findManyWithPagination({
      page: 1,
      limit: 10,
    });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.editorChoiceCourseRepository.count();
    paginationOptions.total = total;

    const getData = await this.editorChoiceCourseRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      order: {
        position: 'ASC',
      },
    });

    return infinityPagination(
      getData,
      EditorChoiceCourseResource,
      paginationOptions,
    );
  }
}
