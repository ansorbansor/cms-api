import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTemporaryCourseDto {
  @IsNotEmpty()
  external_id: number;

  @IsOptional()
  name: string;

  @IsOptional()
  coach: string;

  @IsOptional()
  duration: number;

  @IsOptional()
  provider_id: number;

  @IsOptional()
  category: string;

  @IsOptional()
  topic: string;

  @IsOptional()
  level: string;

  @IsOptional()
  date_course: string;

  @IsOptional()
  rating: number;

  @IsOptional()
  description: string;

  @IsOptional()
  url: string;

  @IsOptional()
  price: number;

  @IsOptional()
  freemium_code: string;

  @IsOptional()
  photo: string;

  @IsOptional()
  language: string;

  @IsOptional()
  rating_count: number;
}
