import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'po_custom_columns' })
export class POCustomColumn extends EntityHelper {
  @ApiProperty({ example: 'col_vendor_code' })
  @Column({ unique: true })
  column_name: string;

  @ApiProperty({ example: 'Vendor Code' })
  @Column()
  display_label: string;

  @ApiProperty({ example: 'varchar' })
  @Column({ default: 'varchar' })
  data_type: string;

  @ApiProperty({ example: 150 })
  @Column({ default: 150 })
  width: number;

  @ApiProperty({ example: false })
  @Column({ default: false })
  is_required: boolean;

  @ApiProperty({ example: 0 })
  @Column({ default: 0 })
  order_index: number;
}
