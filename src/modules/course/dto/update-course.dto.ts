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

export class UpdateCourseDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'ID pelatihan tidak boleh kosong' })
  id: number;

  @ApiProperty({ example: 'Course A' })
  @Validate(IsNotExist, ['Course', 'name'], {
    message: 'Nama pelatihan sudah ada',
  })
  @IsNotEmpty({ message: 'Nama pelatihan tidak boleh kosong' })
  name: string;

  @ApiProperty({ example: 'Pelatih A' })
  @IsNotEmpty({ message: 'Nama pelatih tidak boleh kosong' })
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
  @IsNotEmpty({ message: 'Status pelatihan tidak boleh kosong' })
  @Transform(({ value }) => (value === 'true' ? 1 : 0))
  status: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Topik pelatihan tidak boleh kosong' })
  @Validate(IsExist, ['Topic', 'id'], {
    message: 'Topik tidak tersedia',
  })
  topic_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Level pelatihan tidak boleh kosong' })
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
  @IsNotEmpty({ message: 'Rating pelatihan tidak boleh kosong' })
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
  @IsNotEmpty({ message: 'URL pelatihan tidak boleh kosong' })
  url?: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Jenis harga pelatihan tidak boleh kosong' })
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
