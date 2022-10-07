import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderCategory } from 'src/entities/provider-category.entity';
import fetch from 'node-fetch';
import { CourseFetchSetting } from 'src/entities/course-fetch-setting.entity';
import { FetchUdemyResource } from './resource/fetch-udemy.resources';
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
import { CoursePriceType } from 'src/utils/enums';
import { getFileExtension } from 'src/utils/file-helper';

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
    private fileService: FilesService,
  ) {}

  async fetchData(providerId: number, userId: number) {
    //get provider categories
    const providerCategories = await this.providerCategoryRepository
      .createQueryBuilder('providerCategory')
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
      (e) => e.type == 'base-url-get-course',
    );

    if (!baseUrlGetCourse) {
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
        30
    ) {
      throw failedResponse(
        HttpStatus.NOT_ACCEPTABLE,
        `Sedang melakukan proses pengambilan data, harap tunggu.`,
      );
    }

    let savedDataCount = 0;
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

      //max from udemy 60
      const limit = 50;

      //get limit item fetch
      let url = `${baseUrlGetCourse.value}?source_page=category_page&page_size=${limit}&category_id=${categoryItem.external_id}&locale=id_ID&sos=pc&fl=cat&p=${page}
      &fields[course]=title,url,image_480x270,context_info,visible_instructors,locale,estimated_content_length,rating,num_reviews,description,objectives_summary,content_info_short,instructional_level_simple,price_detail`;
      const headers = {
        Authorization:
          'Basic MXlsc3RPU1YyMXpHcWJ2cG9wOW1EN243RTFnT3RnTEdkMlJ3a1FsTzpqTGF6QzVHS0lTM3c5dGRDdm00MXRuamlxUjZhTjE0blloOTA4b1hlZzNJaFNWSlNxbVFrS2Zxc0lwQlN4bW1xUEdqODZDVHJKWEtlVEZPWFg5ckV6SVlWaEEzaDZCektjM0s5QkJMR3ZPR1RDcU9uMWQ0TFY0WFpudnhxYTVBVw==',
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json;charset=utf-8',
      };
      let response = await fetch(url, {
        headers: headers,
        credentials: 'include',
      });
      console.log(response);
      let data = await response.json();
      console.log('===============================');
      console.log(data);

      const totalItemCount = data.unit.pagination.total_item_count;

      while (itemCount < totalItemCount) {
        //get existing external id
        const existingCourse = await this.temporaryCourseRepository
          .createQueryBuilder('temp')
          .select('temp.external_id')
          .getMany();

        //start fetching
        url = `${baseUrlGetCourse.value}?source_page=category_page&page_size=${limit}&category_id=${categoryItem.external_id}&locale=id_ID&sos=pc&fl=cat&p=${page}
        &fields[course]=title,url,image_480x270,context_info,visible_instructors,locale,estimated_content_length,rating,num_reviews,description,objectives_summary,content_info_short,instructional_level_simple,price_detail`;

        response = await fetch(url, {
          headers: headers,
          credentials: 'include',
        });
        data = await response.json();

        const returnedData = data.unit.items.map((data) => {
          return FetchUdemyResource(data);
        });

        itemCount += returnedData.length;

        //arrange temporary course
        const mapDataTemporary = [];
        for (const data of returnedData) {
          if (!existingCourse.find((e) => e.external_id == data.id)) {
            const post = new CreateTemporaryCourseDto();
            post.external_id = data.id;
            post.name = data.title;
            post.coach = data.coach;
            post.duration = data.duration
              ? data.duration.replace(',', '.').replace(/[^0-9.]/g, '') * 60
              : 0;
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
            post.photo = data.image;
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
        for (const data of returnedData) {
          if (!existingCourse.find((e) => e.external_id == data.id)) {
            //find category
            const findCategory =
              data.category && data.category.name
                ? existingCategories.find((e) =>
                    e.name
                      .toLocaleLowerCase()
                      .includes(data.category.name.toLowerCase()),
                  )
                : null;
            //find category
            const findTopic =
              data.topic && data.topic.name
                ? existingTopics.find((e) =>
                    e.name
                      .toLocaleLowerCase()
                      .includes(data.topic.name.toLowerCase()),
                  )
                : null;
            //find category
            const findLevel =
              data.level && data.level.name
                ? existingLevels.find((e) =>
                    e.name
                      .toLocaleLowerCase()
                      .includes(data.level.toLowerCase()),
                  )
                : null;
            //find language
            const findLanguage = data.language
              ? existingLanguages.find((e) =>
                  e.name
                    .toLocaleLowerCase()
                    .includes(data.language.toLowerCase()),
                )
              : null;
            //get file image
            const fileExt = getFileExtension(data.image);
            const res = await fetch(data.image);
            const resBuffer = await res.buffer();

            //save get image
            const img = await this.fileService.uploadWithMinioBuffer(
              resBuffer,
              userId,
              `${data.id}.${fileExt}`,
            );

            const post = new CreateCourseDto();
            post.external_id = data.id;
            post.name = data.title;
            post.coach = data.coach;
            post.duration =
              data.duration.replace(',', '.').replace(/[^0-9.]/g, '') * 60;
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
            post.photo = img.id;
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

        if (mapDataCourse.length > 0) {
          //save to course
          const savedData = await this.courseRepository.save(mapDataCourse);
          savedDataCount += savedData.length;

          //mapping data course language
          const saveLanguage = [];
          mapDataCourseLanguage.forEach((e) => {
            const findData = savedData.find((elem) => {
              elem.external_id == e.external_id;
            });
            if (findData) {
              saveLanguage.push({
                course_id: findData.id,
                language_id: e.language_id,
              });
            }
          });

          //save to course language
          await this.courseLanguageTransactionRepository.save(saveLanguage);

          //save history fetch
          const saveHistoryFetch = new CreateCourseFetchHistoryDto();
          saveHistoryFetch.provider_id = providerId;
          saveHistoryFetch.first_page = page;
          saveHistoryFetch.last_page = data.unit.pagination.current_page + 1;
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
        }

        page = data.unit.pagination.current_page + 1;
      }
    }

    if (savedDataCount == 0) {
      throw failedResponse(
        HttpStatus.UNPROCESSABLE_ENTITY,
        `Tidak ada data baru`,
      );
    }

    return successResponse(null, `Berhasil menambah ${savedDataCount} data`);
  }
}
