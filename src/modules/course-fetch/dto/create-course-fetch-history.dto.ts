import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCourseFetchHistoryDto {
  @IsOptional()
  provider_id: number;

  @IsNotEmpty()
  first_page: number;

  @IsNotEmpty()
  last_page: number;

  @IsNotEmpty()
  limit: number;

  @IsNotEmpty()
  item_count: number;

  @IsNotEmpty()
  total_item_count: number;

  @IsNotEmpty()
  total_item_inserted: number;

  @IsNotEmpty()
  provider_category_id: number;
}
