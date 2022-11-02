import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition, IPaginationOptions } from 'src/utils/types';
import { Brackets, getManager, Repository } from 'typeorm';
import { failedResponse, infinityPagination } from 'src/utils/responses';
import { RedisService } from '../redis/redis.service';
import { FilePath, RedisKeyEnum } from 'src/utils/enums';
import { CourseCategoryResource } from './resources/course-category.resources';
import { CreateCourseCategoryDto } from './dto/create-course-category.dto';
import { UpdateCourseCategoryDto } from './dto/update-course-category.dto';
import { FilesService } from '../files/files.service';
import { User } from 'src/entities/user.entity';
import { CourseCategory } from 'src/entities/course-category.entity';
import { BufferedFile } from 'src/utils/file-helper';
import { CreateTopicDto } from '../topics/dto/create-topic.dto';
import { TopicsService } from '../topics/topics.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class CourseCategoriesService {
  constructor(
    @InjectRepository(CourseCategory)
    private categoryRepository: Repository<CourseCategory>,
    private redisService: RedisService,
    private fileService: FilesService,
    private topicService: TopicsService,
    private activityLogService: ActivityLogService,
  ) {}

  async create(
    createCourseCategoryDto: CreateCourseCategoryDto,
    photo: BufferedFile,
    user: User,
    ip: string,
  ) {
    if (!photo) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Photo tidak boleh kosong',
      );
    }

    const img = await this.fileService.uploadWithMinio(
      photo,
      user.id,
      FilePath.CATEGORY,
      'Category Thumbnail',
    );
    createCourseCategoryDto.photo = img;

    const category = await this.categoryRepository.save(
      this.categoryRepository.create({
        name: createCourseCategoryDto.name,
        pkasn_program: createCourseCategoryDto.pkasn_program,
        photo: img.id,
      }),
    );

    if (createCourseCategoryDto.topic) {
      const topics = [];
      createCourseCategoryDto.topic.forEach((element) => {
        const topic = new CreateTopicDto();
        topic.name = element;
        topic.category_id = category.id;
        topics.push(topic);
      });

      await this.topicService.createBulk(topics);
    }

    await this.activityLogService.create({
      user_id: user.id,
      description: `Tambah Kategori ${createCourseCategoryDto.name}`,
      ip: ip,
    });

    return this.findOne({ id: category.id }, true);
  }

  async findManyWithPagination(
    paginationOptions: IPaginationOptions,
    withTopics?: boolean,
  ) {
    const redisKey = `${RedisKeyEnum.category}:-Page${paginationOptions.page}-Limit${paginationOptions.limit}-Search${paginationOptions.search}-WithTopics${withTopics}`;

    const value = await this.redisService.get(
      redisKey,
      typeof CourseCategoryResource,
    );
    if (value != null) {
      return value;
    }

    const data = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.photoFile', 'photoFile');

    if (withTopics) {
      data.leftJoinAndSelect('category.topic', 'topic');
    }

    if (paginationOptions.search) {
      data.andWhere(
        new Brackets((qb) => {
          qb.where(
            `LOWER(category.name) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
          ).orWhere(
            `LOWER(category.pkasn_program) LIKE '%${paginationOptions.search.toLowerCase()}%'`,
          );
        }),
      );
    }

    const total = await data.getCount();
    paginationOptions.total = total;

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    const getData = await data.getMany();

    const categoryId = getData.map((e) => {
      return e.id;
    });

    const topicId = withTopics
      ? getData.flatMap((e) => {
          if (e.topic) {
            return e.topic.map((elem) => {
              return elem.id;
            });
          } else {
            return null;
          }
        })
      : [];

    const categoryCourseCount = await getManager().query(
      `SELECT COUNT(id) as total, category_id FROM courses WHERE status = 1 AND deleted_at IS NULL${
        categoryId.length > 0 ? ` AND category_id IN (${categoryId})` : ''
      } GROUP BY category_id`,
    );

    const courseTopicCount = await getManager().query(
      `SELECT COUNT(id) as total, topic_id, category_id FROM courses WHERE status = 1 AND deleted_at IS NULL${
        topicId.length > 0 ? ` AND topic_id IN (${topicId})` : ''
      } GROUP BY topic_id, category_id`,
    );

    const returnData = infinityPagination(
      getData,
      CourseCategoryResource,
      paginationOptions,
      {
        categoryCourseCount: categoryCourseCount,
        topicCourseCount: courseTopicCount,
      },
    );

    this.redisService.set(redisKey, returnData);

    return returnData;
  }

  async findOne(fields: EntityCondition<CourseCategory>, withTopics?: boolean) {
    const value = await this.redisService.get(
      `${RedisKeyEnum.category}:${fields.id}`,
      typeof CourseCategoryResource,
    );
    if (value != null) {
      return value;
    }

    const relation = [];
    if (withTopics) {
      relation.push('topic');
    }

    const data = await this.categoryRepository.findOne({
      where: fields,
      relations: relation,
    });

    const topicId = data.topic.map((elem) => {
      return elem.id;
    });

    const categoryCourseCount = await getManager().query(
      `SELECT COUNT(id) as total, category_id FROM courses WHERE status = 1 AND deleted_at IS NULL AND category_id = ${fields.id} GROUP BY category_id`,
    );

    const courseTopicCount = await getManager().query(
      `SELECT COUNT(id) as total, topic_id FROM courses WHERE status = 1 AND deleted_at IS NULL${
        topicId.length > 0 ? ` AND topic_id IN (${topicId})` : ''
      } GROUP BY topic_id`,
    );

    if (!data) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Kategori tidak ditemukan',
      );
    }

    this.redisService.set(
      `${RedisKeyEnum.category}:${fields.id}`,
      CourseCategoryResource(data, null, {
        categoryCourseCount: categoryCourseCount,
        topicCourseCount: courseTopicCount,
      }),
    );

    return CourseCategoryResource(data, null, {
      categoryCourseCount: categoryCourseCount,
      topicCourseCount: courseTopicCount,
    });
  }

  async update(
    updateCourseCategoryDto: UpdateCourseCategoryDto,
    photo: BufferedFile,
    user: User,
    ip: string,
  ) {
    const exists = await this.findOne(
      { id: updateCourseCategoryDto.id },
      false,
    );

    if (!exists) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Kategori tidak ditemukan',
      );
    }

    let updateData = null;

    if (photo) {
      const img = await this.fileService.uploadWithMinio(
        photo,
        user.id,
        FilePath.CATEGORY,
        'Category Thumbnail',
      );
      updateData = {
        name: updateCourseCategoryDto.name,
        pkasn_program: updateCourseCategoryDto.pkasn_program,
        photo: img.id,
      };
    } else {
      updateData = {
        name: updateCourseCategoryDto.name,
        pkasn_program: updateCourseCategoryDto.pkasn_program,
      };
    }

    await this.categoryRepository.update(
      updateCourseCategoryDto.id,
      updateData,
    );

    if (updateCourseCategoryDto.topic) {
      const topics = [];
      updateCourseCategoryDto.topic.forEach((element) => {
        const topic = new CreateTopicDto();
        topic.name = element;
        topic.category_id = updateCourseCategoryDto.id;
        topics.push(topic);
      });
      await this.topicService.softDeleteByCategory(updateCourseCategoryDto.id);
      await this.topicService.createBulk(topics);
    }

    await this.activityLogService.create({
      user_id: user.id,
      description: `Update Kategori ${updateCourseCategoryDto.name}`,
      ip: ip,
    });

    this.redisService.del(`${RedisKeyEnum.category}`);
    this.redisService.del(`${RedisKeyEnum.course}`);

    return await this.findOne({ id: updateCourseCategoryDto.id }, true);
  }

  async softDelete(id: number, user: User, ip: string): Promise<void> {
    this.redisService.del(`${RedisKeyEnum.category}:${id}`);
    this.redisService.del(`${RedisKeyEnum.course}`);
    const deletedData = await this.categoryRepository.findOne({ id: id });
    await this.topicService.softDeleteByCategory(id);
    await this.categoryRepository.softDelete(id);

    await this.activityLogService.create({
      user_id: user.id,
      description: `Hapus Kategori ${deletedData.name}`,
      ip: ip,
    });
  }
}
