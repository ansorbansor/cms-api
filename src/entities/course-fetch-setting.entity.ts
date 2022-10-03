import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'course_fetch_settings' })
export class CourseFetchSetting extends EntityHelper {
  @ApiProperty()
  @Column()
  provider_id?: number;

  @ApiProperty()
  @Column()
  type?: string;

  @ApiProperty()
  @Column()
  value?: string;

  @ApiProperty()
  @Column()
  description?: string;
}
