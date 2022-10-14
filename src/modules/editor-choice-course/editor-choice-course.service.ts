import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'src/utils/types';
import { getManager, Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { EditorChoiceCourse } from 'src/entities/editor-choice-course.entity';
import { CreateEditorChoiceCourseDto } from './dto/create-editor-choice-course.dto';
import { User } from 'src/entities/user.entity';
import { EditorChoiceCourseResource } from './resources/editor-choice-course.resources';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class EditorChoiceCourseService {
  constructor(
    @InjectRepository(EditorChoiceCourse)
    private editorChoiceCourseRepository: Repository<EditorChoiceCourse>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(
    createEditorChoiceCourseDto: CreateEditorChoiceCourseDto[],
    user: User,
    ip: string,
  ) {
    if (createEditorChoiceCourseDto.length > 10) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        'Course pilihan editor maksimal 10',
      );
    }
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

    await this.activityLogService.create({
      user_id: user.id,
      description: `Ubah Course Pilihan Editor`,
      ip: ip,
    });

    return this.findManyWithPagination({
      page: 1,
      limit: 10,
    });
  }

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const total = await this.editorChoiceCourseRepository.count();
    paginationOptions.total = total;

    const data = this.editorChoiceCourseRepository
      .createQueryBuilder('editorChoice')
      .leftJoinAndSelect('editorChoice.courseData', 'courseData')
      .leftJoinAndSelect('courseData.provider', 'provider')
      .leftJoinAndSelect('courseData.courseCategory', 'category')
      .leftJoinAndSelect('courseData.topic', 'topic')
      .leftJoinAndSelect('courseData.courseLevel', 'courseLevel')
      .leftJoinAndSelect('courseData.courseLanguage', 'courseLanguage')
      .leftJoinAndSelect('courseLanguage.language', 'language')
      .leftJoinAndSelect('courseData.coursePrice', 'coursePrice')
      .leftJoinAndSelect('courseData.photoFile', 'photoFile')
      .orderBy('editorChoice.position', 'ASC');

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    const getData = await data.getMany();
    return infinityPagination(
      getData,
      EditorChoiceCourseResource,
      paginationOptions,
    );
  }
}
