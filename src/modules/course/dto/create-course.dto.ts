import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, NotEquals, Validate } from 'class-validator';
import { IsExist, IsNotExist } from 'src/utils/validators';

export class CreateCourseDto {
  @ApiProperty({ example: 'Course A' })
  @Validate(IsNotExist, ['Course', 'name'], {
    message: 'Nama course sudah ada',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Pelatih A' })
  @IsNotEmpty()
  coach?: string;

  @ApiProperty({ example: 1, description: 'in minute' })
  @IsNotEmpty()
  duration: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @Validate(IsExist, ['Provider', 'id'], {
    message: 'Penyelenggara tidak tersedia',
  })
  provider_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @Validate(IsExist, ['CourseCategory', 'id'], {
    message: 'Kategori tidak tersedia',
  })
  category_id: number;

  @ApiProperty({ example: true })
  @IsNotEmpty()
  status: boolean;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @Validate(IsExist, ['Topic', 'id'], {
    message: 'Topik tidak tersedia',
  })
  topic_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @Validate(IsExist, ['CourseLevel', 'id'], {
    message: 'Level tidak tersedia',
  })
  level_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @Validate(IsExist, ['CourseLanguage', 'id'], {
    message: 'Bahasa tidak tersedia',
  })
  language_id: number;

  @ApiProperty({ example: '2022-01-1 00:00' })
  @IsOptional()
  date_course?: Date;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @NotEquals([1, 2, 3, 4, 5], {
    message: 'Rating hanya 1-5',
  })
  rating: number;

  @ApiProperty({ example: 'Lorem Ipsum' })
  @IsNotEmpty()
  description?: string;

  @ApiProperty({
    example:
      'https://www.udemy.com/course/the-ultimate-hands-on-hadoop-tame-your-big-data/',
  })
  @IsNotEmpty()
  url?: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @Validate(IsExist, ['CoursePrice', 'id'], {
    message: 'Jenis harga tidak tersedia',
  })
  price_id: number;

  @ApiProperty({ example: 100000 })
  @IsNotEmpty()
  price?: number;

  @ApiProperty({ example: 'Lorem#123' })
  @IsNotEmpty()
  freemium_code?: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  photo: any;
}
