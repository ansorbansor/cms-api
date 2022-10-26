import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, In, Repository } from 'typeorm';
import { ProviderCategory } from 'src/entities/provider-category.entity';
import fetch from 'node-fetch';
import * as https from 'https';
import { CourseFetchSetting } from 'src/entities/course-fetch-setting.entity';
import { FetchCourseResource } from './resource/fetch-course.resources';
import { failedResponse, successResponse } from 'src/utils/responses';
import { CreateTemporaryCourseDto } from './dto/create-temporary-course.dto';
import { TemporaryCourse } from 'src/entities/temporary-course.entity';
import { CourseFetchHistory } from 'src/entities/course-fetch-history.entity';
import { CreateCourseFetchHistoryDto } from './dto/create-course-fetch-history.dto';
import { CreateCourseDto } from '../course/dto/create-course.dto';
import { CourseCategory } from 'src/entities/course-category.entity';
import { CourseLevel } from 'src/entities/course-level.entity';
import { Topic } from 'src/entities/topic.entity';
import { CourseLanguage } from 'src/entities/course-language.entity';
import { CourseLanguageTransaction } from 'src/entities/course-language-transaction.entity';
import { Course } from 'src/entities/course.entity';
import { FilesService } from '../files/files.service';
import {
  CourseFetchSettingType,
  CoursePriceType,
  NotificationSource,
  NotificationType,
  RedisKeyEnum,
} from 'src/utils/enums';
import { getFileExtension } from 'src/utils/file-helper';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { Provider } from 'src/entities/provider.entity';
import courseFetchConfig from 'src/config/course-fetch.config';
import { RedisService } from '../redis/redis.service';
import { CreateUserNotificationDto } from '../user-notification/dto/create-user-notification.dto';
import { UserNotificationService } from '../user-notification/user-notification.service';

@Injectable()
export class CourseFetchService {
  constructor(
    @InjectRepository(ProviderCategory)
    private providerCategoryRepository: Repository<ProviderCategory>,
    @InjectRepository(CourseFetchSetting)
    private courseFetchSettingRepository: Repository<CourseFetchSetting>,
    @InjectRepository(TemporaryCourse)
    private temporaryCourseRepository: Repository<TemporaryCourse>,
    @InjectRepository(CourseFetchHistory)
    private courseFetchHistoryRepository: Repository<CourseFetchHistory>,
    @InjectRepository(CourseCategory)
    private courseCategoryRepository: Repository<CourseCategory>,
    @InjectRepository(CourseLevel)
    private courseLevelRepository: Repository<CourseLevel>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(CourseLanguage)
    private courseLanguageRepository: Repository<CourseLanguage>,
    @InjectRepository(CourseLanguageTransaction)
    private courseLanguageTransactionRepository: Repository<CourseLanguageTransaction>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    private fileService: FilesService,
    private activityLogService: ActivityLogService,
    private redisService: RedisService,
    private userNotificationService: UserNotificationService,
  ) {}

  async fetchData(providerId: number, userId: number, ip: string) {
    //get provider categories
    const providerCategories = await this.providerCategoryRepository
      .createQueryBuilder('providerCategory')
      .leftJoinAndSelect('providerCategory.providerData', 'providerData')
      .where('providerCategory.provider_id = :id', { id: providerId })
      .getMany();

    if (!providerCategories) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        'Kategori penyedia tidak ditemukan!',
      );
    }

    //get fetch setting
    const setting = await this.courseFetchSettingRepository
      .createQueryBuilder('setting')
      .where('setting.provider_id = :id', { id: providerId })
      .getMany();

    if (!setting) {
      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        'Pengaturan penyedia tidak ditemukan!',
      );
    }

    //get fetch url for get course
    const baseUrlGetCourse = setting.find(
      (e) => e.type == CourseFetchSettingType.BASE_URL_GET_COURSE,
    );
    //get url for get open course page
    const baseUrlCoursePage = setting.find(
      (e) => e.type == CourseFetchSettingType.BASE_URL_COURSE_PAGE,
    );
    //get fetch url for get course detail
    const baseUrlGetCourseDetail = setting.find(
      (e) => e.type == CourseFetchSettingType.BASE_URL_GET_COURSE_DETAIL,
    );

    if (!baseUrlGetCourse || !baseUrlCoursePage) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'Base URL tidak ditemukan!');
    }

    const lastFetchValidity = await this.courseFetchHistoryRepository
      .createQueryBuilder('history')
      .orderBy('history.id', 'DESC')
      .getOne();

    if (
      lastFetchValidity &&
      (new Date().getTime() -
        new Date(lastFetchValidity.created_at).getTime()) /
        (1000 * 60) <
        10
    ) {
      throw failedResponse(
        HttpStatus.NOT_ACCEPTABLE,
        `Sedang melakukan proses pengambilan data, harap tunggu.`,
      );
    }

    let savedDataCount = 0;
    let limit = 50;

    for (const categoryItem of providerCategories) {
      //get last history fetch
      const lastFetch = await this.courseFetchHistoryRepository
        .createQueryBuilder('history')
        .where('history.provider_id = :providerId', {
          providerId: providerId,
        })
        .andWhere('history.provider_category_id = :categoryId', {
          categoryId: categoryItem.id,
        })
        .orderBy('history.id', 'DESC')
        .getOne();

      let page = lastFetch ? lastFetch.last_page + 1 : 1;
      let itemCount = lastFetch ? lastFetch.item_count : 0;

      const [returnedData, usedLimit] = await this.startFetch(
        categoryItem,
        baseUrlGetCourse.value,
        limit,
        page,
      );

      let data = returnedData;
      limit = usedLimit;

      let totalItemCount = 0;
      if (categoryItem.providerData.name.toLowerCase().includes('udemy')) {
        totalItemCount = data.unit.pagination.total_item_count;
      } else if (
        categoryItem.providerData.name.toLowerCase().includes('skill academy')
      ) {
        totalItemCount = data.data.totalItems;
      } else if (
        categoryItem.providerData.name.toLowerCase().includes('terampil')
      ) {
        totalItemCount = data.data.Trainings.filtered;
      }

      while (itemCount < totalItemCount) {
        //get existing external id
        const existingCourse = await this.temporaryCourseRepository
          .createQueryBuilder('temp')
          .select('temp.external_id')
          .getMany();

        //start fetching
        const [returnedData, usedLimit] = await this.startFetch(
          categoryItem,
          baseUrlGetCourse.value,
          limit,
          page,
        );

        data = returnedData;
        limit = usedLimit;

        const formattedData =
          categoryItem.providerData.name.toLowerCase().includes('udemy') &&
          data.unit.items
            ? data.unit.items.map((data) => {
                return FetchCourseResource(
                  data,
                  categoryItem.providerData.name,
                  baseUrlCoursePage.value,
                  null,
                );
              })
            : categoryItem.providerData.name
                .toLowerCase()
                .includes('skill academy')
            ? await Promise.all(
                data.data.courses.map(async (data) => {
                  const fetchData = await fetch(
                    `${baseUrlGetCourseDetail.value}?courseSerial=${data.serial}`,
                  );
                  const dataDetail = await fetchData.json();

                  return FetchCourseResource(
                    data,
                    categoryItem.providerData.name,
                    baseUrlCoursePage.value,
                    dataDetail,
                  );
                }),
              )
            : categoryItem.providerData.name
                .toLocaleLowerCase()
                .includes('terampil')
            ? data.data.Trainings.items.map((data) => {
                return FetchCourseResource(
                  data,
                  categoryItem.providerData.name,
                  baseUrlCoursePage.value,
                  null,
                );
              })
            : null;

        if (!formattedData) {
          throw failedResponse(
            HttpStatus.EXPECTATION_FAILED,
            'Providers tidak memiliki data lain.',
          );
        }

        itemCount += formattedData.length;

        //arrange temporary course
        const mapDataTemporary = [];
        for (const data of formattedData) {
          if (!existingCourse.find((e) => e.external_id == data.id)) {
            const post = new CreateTemporaryCourseDto();
            post.external_id = data.id;
            post.name = data.title;
            post.coach = data.coach;
            post.duration = data.duration;
            post.provider_id = providerId;
            post.category = data.category.name;
            post.topic = data.topic.name;
            post.level = data.level;
            post.date_course = null;
            post.rating = Math.round(data.rating);
            post.description = data.description;
            post.url = data.url;
            post.price = data.price;
            post.freemium_code = null;
            post.photo = data.image ? data.image : null;
            post.language = data.language;
            post.rating_count = data.rating_count;
            mapDataTemporary.push(post);
          }
        }

        //start arrange real course
        //get existing categories
        const existingCategories = await this.courseCategoryRepository.find();
        //get existing topic
        const existingTopics = await this.topicRepository.find();
        //get existing level
        const existingLevels = await this.courseLevelRepository.find();
        //get existing language
        const existingLanguages = await this.courseLanguageRepository.find();

        const mapDataCourse = [];
        const mapDataCourseLanguage = [];
        for (const data of formattedData) {
          if (!existingCourse.find((e) => e.external_id == data.id)) {
            //find category
            const findCategory =
              data.category && data.category.name
                ? existingCategories.find((e) =>
                    e.name
                      .toLowerCase()
                      .includes(categoryItem.name.toLowerCase()),
                  )
                : null;
            //find category
            const findTopic =
              data.topic && data.topic.name
                ? existingTopics.find((e) =>
                    e.name
                      .toLowerCase()
                      .includes(data.topic.name.toLowerCase()),
                  )
                : null;
            //find level
            const findLevel =
              data.level && data.level
                ? existingLevels.find((e) =>
                    e.name.toLowerCase().includes(data.level.toLowerCase()),
                  )
                : null;
            //find language
            const findLanguage = data.language
              ? existingLanguages.find((e) =>
                  e.name.toLowerCase().includes(data.language.toLowerCase()),
                )
              : null;
            //get file image
            let img = null;
            if (data.image) {
              const fileExt = getFileExtension(data.image);
              const res = await fetch(data.image);
              const resBuffer = await res.buffer();

              //save get image
              img = await this.fileService.uploadWithMinioBuffer(
                resBuffer,
                userId,
                `${data.id}.${fileExt}`,
              );
            }

            const post = new CreateCourseDto();
            post.external_id = data.id;
            post.name = data.title;
            post.coach = data.coach;
            post.duration = data.duration;
            post.provider_id = providerId;
            post.category_id = findCategory ? findCategory.id : null;
            post.topic_id = findTopic ? findTopic.id : null;
            post.level_id = findLevel ? findLevel.id : null;
            post.date_course = null;
            post.rating = Math.round(data.rating);
            post.description = data.description;
            post.url = data.url;
            post.price_id =
              data.price && data.price > 0
                ? CoursePriceType.PAID
                : CoursePriceType.FREE;
            post.price = data.price;
            post.freemium_code = null;
            post.photo = img && img.id ? img.id : null;
            post.rating_count = data.rating_count;
            mapDataCourse.push(post);

            if (findLanguage) {
              mapDataCourseLanguage.push({
                external_id: data.id,
                language_id: findLanguage.id,
              });
            }
          }
        }

        if (mapDataTemporary.length > 0) {
          //save to temporary course
          await this.temporaryCourseRepository.save(mapDataTemporary);
        }

        //get last page
        let lastPage = 0;
        if (categoryItem.providerData.name.toLowerCase().includes('udemy')) {
          lastPage = data.unit.pagination.current_page + 1;
        } else if (
          categoryItem.providerData.name.toLowerCase().includes('skill academy')
        ) {
          lastPage = data.data.totalPage;
        } else if (
          categoryItem.providerData.name.toLowerCase().includes('terampil')
        ) {
          lastPage = Math.ceil(data.data.Trainings.filtered / limit);
        }

        if (mapDataCourse.length > 0) {
          //save to course
          const savedData = await this.courseRepository.save(mapDataCourse);
          savedDataCount += savedData.length;

          //mapping data course language
          const saveLanguage = [];
          for (const e of mapDataCourseLanguage) {
            const findData = savedData.find((elem) => {
              return elem.external_id === e.external_id;
            });

            if (findData) {
              saveLanguage.push({
                course_id: findData.id,
                language_id: e.language_id,
              });
            }
          }

          //save to course language
          await this.courseLanguageTransactionRepository.save(saveLanguage);

          //save history fetch
          const saveHistoryFetch = new CreateCourseFetchHistoryDto();
          saveHistoryFetch.provider_id = providerId;
          saveHistoryFetch.first_page = page;
          saveHistoryFetch.last_page = lastPage;
          saveHistoryFetch.limit = limit;
          saveHistoryFetch.item_count = itemCount;
          saveHistoryFetch.total_item_count = totalItemCount;
          saveHistoryFetch.total_item_inserted = savedData.length;
          saveHistoryFetch.provider_category_id = categoryItem.id;

          await this.courseFetchHistoryRepository.save(
            this.courseFetchHistoryRepository.create({
              ...saveHistoryFetch,
            }),
          );

          const redisKey = `${RedisKeyEnum.course}:`;
          this.redisService.del(redisKey);

          await this.providerRepository.update(providerId, {
            last_update: new Date(),
          });
        }

        page = lastPage;
      }
    }

    const notif = new CreateUserNotificationDto();
    notif.user_id = userId;
    notif.title = 'Update data pembelajaran selesai';
    notif.description = `Tidak ada data baru untuk ditambahkan`;
    notif.type = NotificationType.GENERAL;
    notif.source = NotificationSource.CMS;

    if (savedDataCount == 0) {
      await this.userNotificationService.create(notif);
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        `Tidak ada data baru`,
      );
    }

    const provider = await this.providerRepository.findOne({ id: providerId });

    await this.activityLogService.create({
      user_id: userId,
      description: `Update Data List Course ${provider.name}`,
      ip: ip,
    });

    notif.description = `Berhasil menambah ${savedDataCount} data`;

    await this.userNotificationService.create(notif);

    return successResponse(null, `Berhasil menambah ${savedDataCount} data`);
  }

  async startFetch(
    categoryItem: ProviderCategory,
    baseUrl: string,
    usedLimit: number,
    page: number,
  ) {
    let url;
    let headers;
    let method = 'GET';
    let body;

    if (categoryItem.providerData.name.toLowerCase().includes('udemy')) {
      //get limit item fetch
      url = `${baseUrl}?source_page=category_page&page_size=${usedLimit}&category_id=${categoryItem.external_id}&locale=id_ID&sos=pc&fl=cat&p=${page}
      &fields[course]=title,url,image_480x270,context_info,visible_instructors,locale,estimated_content_length,rating,num_reviews,description,objectives_summary,content_info_short,instructional_level_simple,price_detail`;
      headers = {
        Authorization: `Basic ${btoa(courseFetchConfig().udemyClientId)}:${btoa(
          courseFetchConfig().udemyClientSecret,
        )}`,
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json;charset=utf-8',
        'X-Udemy-Client-Id': courseFetchConfig().udemyClientId,
        'X-Udemy-Client-Secret': courseFetchConfig().udemyClientSecret,
        'X-Requested-With': 'XMLHttpRequest',
      };
    } else if (
      categoryItem.providerData.name.toLowerCase().includes('skill academy')
    ) {
      url = `${baseUrl}?page=${page}&pageSize=${usedLimit}&serials=${categoryItem.external_id}`;
    } else if (
      categoryItem.providerData.name.toLowerCase().includes('terampil')
    ) {
      method = 'POST';
      headers = {
        'Content-Type': 'application/json',
      };
      body = JSON.stringify({
        operationName: 'GET_TRAININGS_AND_RECOMMENDATION',
        variables: {
          input: {
            limit: usedLimit,
            page: page,
            orderBy: 'created_at',
            orderType: 'desc',
          },
        },
        query:
          'query GET_TRAININGS_AND_RECOMMENDATION($input: TrainingsRequest) {\n  Trainings(input: $input) {\n    status\n    statusText\n    total\n    filtered\n    items {\n      id\n      title\n      thumbnail\n      training_prakerja\n      description\n      training_price\n      tag\n      trainer {\n        fullname\n        rating\n        slug\n        __typename\n      }\n      total_rating\n      viewers\n      category {\n        id\n        name\n        __typename\n      }\n      rating\n      durations\n      slug\n      benefits {\n        title\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n',
      });
      url = baseUrl;
    }

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    const response = await fetch(url, {
      method: method,
      body: body,
      headers: headers,
      credentials: 'include',
      agent: httpsAgent,
      redirect: 'follow',
    });

    let returnedData = await response.json();

    if (
      returnedData &&
      returnedData.detail &&
      returnedData.detail.toLowerCase() == 'invalid page size'
    ) {
      const [returnedDataa] = await this.startFetch(
        categoryItem,
        baseUrl,
        usedLimit - 5,
        page,
      );

      returnedData = returnedDataa;
    }

    return [returnedData, usedLimit];
  }

  async deleteAllFetchData(providerId: number, userId: number, ip: string) {
    let deleteData = await getManager().query(`
      SELECT c.id, c.external_id
      FROM courses c
      LEFT JOIN temporary_courses tc
      ON c.external_id = tc.external_id
      LEFT JOIN user_courses uc
      ON
      c.id = uc.course_id
      LEFT JOIN editor_choice_courses ecc
      ON
      c.id = ecc.course_id
      LEFT JOIN coupons cou
      ON
      c.id = cou.course_id
      LEFT JOIN coupon_submissions cs
      ON
      c.id = cs.course_id
      WHERE
      uc.id IS NULL 
      AND
      cou.id IS NULL 
      AND
      ecc.id IS NULL
      AND
      cs.id IS NULL
      AND
      c.provider_id = ${providerId}
      AND
      c.external_id IS NOT NULL
    `);

    const deleteDataCourseId = deleteData.map((e) => {
      return e.id;
    });

    deleteData = deleteData.map((e) => {
      return e.external_id;
    });

    await this.courseLanguageTransactionRepository.delete({
      course_id: In(deleteDataCourseId),
    });

    await this.courseRepository.delete({
      id: In(deleteDataCourseId),
    });

    await this.temporaryCourseRepository.delete({
      external_id: In(deleteData),
    });

    await this.courseFetchHistoryRepository.delete({
      provider_id: providerId,
    });

    await this.activityLogService.create({
      user_id: userId,
      description: `Menghapus data course dari provider ID ${providerId}`,
      ip: ip,
    });

    const redisKey = `${RedisKeyEnum.course}:`;
    this.redisService.del(redisKey);

    return successResponse(
      null,
      `Berhasil menghapus data course dari provider ID ${providerId}`,
    );
  }
}
