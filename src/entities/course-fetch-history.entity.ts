import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'course_fetch_histories' })
export class CourseFetchHistory extends EntityHelper {
  @ApiProperty()
  @Column()
  provider_id?: number;

  @ApiProperty()
  @Column()
  first_page?: number;

  @ApiProperty()
  @Column()
  last_page?: number;

  @ApiProperty()
  @Column()
  limit?: number;

  @ApiProperty()
  @Column()
  item_count?: number;

  @ApiProperty()
  @Column()
  total_item_count?: number;

  @ApiProperty()
  @Column()
  total_item_inserted?: number;

  @ApiProperty()
  @Column()
  provider_category_id?: number;
}
