import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  Validate,
} from 'class-validator';
import { Rating } from 'src/utils/enums';
import { IsExist } from 'src/utils/validators';

export class BulkUpdateCourseDto {
  @ApiProperty({ example: 1 })
  @ArrayMinSize(1, {
    message: 'Course ID tidak boleh kosong',
  })
  @IsArray({
    message: 'Course ID harus array',
  })
  @Validate(IsExist, ['Course', 'id'], {
    message: 'Course tidak tersedia',
  })
  course_id: number[];

  @ApiProperty({ example: 1, description: 'in minute' })
  @IsOptional()
  duration: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['CourseCategory', 'id'], {
    message: 'Kategori tidak tersedia',
  })
  category_id: number;

  @ApiProperty({ example: true })
  @IsOptional()
  @Transform(({ value }) => (value == 'true' || value == true ? 1 : 0))
  status: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['Topic', 'id'], {
    message: 'Topik tidak tersedia',
  })
  topic_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['CourseLevel', 'id'], {
    message: 'Level tidak tersedia',
  })
  level_id: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsArray()
  @Validate(IsExist, ['CourseLanguage', 'id'], {
    message: 'Bahasa tidak tersedia',
  })
  language_id: number[];

  @ApiProperty({ example: '2022-01-1 00:00' })
  @IsOptional()
  date_course?: Date;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsEnum(Rating, {
    message: 'Rating hanya 1-5',
  })
  rating: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Validate(IsExist, ['CoursePrice', 'id'], {
    message: 'Jenis harga tidak tersedia',
  })
  price_id: number;

  @ApiProperty({ example: 100000 })
  @IsOptional()
  price?: number;

  @ApiProperty({ example: 'Lorem#123' })
  @IsOptional()
  freemium_code?: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  photo: any;
}
