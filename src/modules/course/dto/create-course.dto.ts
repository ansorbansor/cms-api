import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  Validate,
} from 'class-validator';
import { Rating } from 'src/utils/enums';
import { IsExist, IsNotExist } from 'src/utils/validators';

export class CreateCourseDto {
  @ApiProperty({ example: 'Course A' })
  @Validate(IsNotExist, ['Course', 'name'], {
    message: 'Nama pelatihan sudah ada',
  })
  @IsNotEmpty({ message: 'Nama pelatihan tidak boleh kosong' })
  name: string;

  @IsOptional()
  external_id: string;

  @ApiProperty({ example: 'Pelatih A' })
  @IsNotEmpty({ message: 'Pelatih tidak boleh kosong' })
  coach?: string;

  @ApiProperty({ example: 1, description: 'in minute' })
  @IsNotEmpty({ message: 'Durasi tidak boleh kosong' })
  @Transform(({ value }) => value * 40)
  duration: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Penyelenggara tidak boleh kosong' })
  @Validate(IsExist, ['Provider', 'id'], {
    message: 'Penyelenggara tidak tersedia',
  })
  provider_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Kategori tidak boleh kosong' })
  @Validate(IsExist, ['CourseCategory', 'id'], {
    message: 'Kategori tidak tersedia',
  })
  category_id: number;

  @ApiProperty({ example: true })
  @IsNotEmpty({ message: 'Status tidak boleh kosong' })
  @Transform(({ value }) => (value === 'true' ? 1 : 0))
  status: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Topik tidak boleh kosong' })
  @Validate(IsExist, ['Topic', 'id'], {
    message: 'Topik tidak tersedia',
  })
  topic_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Level tidak boleh kosong' })
  @Validate(IsExist, ['CourseLevel', 'id'], {
    message: 'Level tidak tersedia',
  })
  level_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Bahasa tidak boleh kosong' })
  @IsArray()
  @Validate(IsExist, ['CourseLanguage', 'id'], {
    message: 'Bahasa tidak tersedia',
  })
  language_id: number[];

  @ApiProperty({ example: '2022-01-1 00:00' })
  @IsOptional()
  date_course?: Date;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Rating tidak boleh kosong' })
  @IsEnum(Rating, {
    message: 'Rating hanya 1-5',
  })
  rating: number;

  @ApiProperty({ example: 'Lorem Ipsum' })
  @IsNotEmpty({ message: 'Deskripsi tidak boleh kosong' })
  description?: string;

  @ApiProperty({
    example:
      'https://www.udemy.com/course/the-ultimate-hands-on-hadoop-tame-your-big-data/',
  })
  @IsNotEmpty({ message: 'URL tidak boleh kosong' })
  url?: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Jenis harga tidak boleh kosong' })
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

  @ApiProperty({ example: 123, default: 0 })
  @IsOptional()
  rating_count?: number;
}
