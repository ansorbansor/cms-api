import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'materials' })
export class Material extends EntityHelper {
  @ApiProperty({ example: 'Ericsson Baseband 6630' })
  @Column()
  material_name: string;

  @ApiProperty({ example: 'Active Equipment' })
  @Column()
  material_category: string;

  @ApiProperty({ example: 'ER-BB6630-99823' })
  @Column({ nullable: true })
  serial_number: string;

  @ApiProperty({ example: 'Ericsson' })
  @Column({ nullable: true })
  brand: string;

  @ApiProperty({ example: 'Customer Supplied' })
  @Column()
  source_type: string;

  @ApiProperty({ example: 'Telkomsel' })
  @Column({ nullable: true })
  owner_client: string;

  @ApiProperty({ example: 'In Warehouse' })
  @Column()
  status: string;

  @ApiProperty({ example: 'JABODETABEK' })
  @Column({ nullable: true })
  warehouse_region: string;

  @ApiProperty({ example: 'JKT-0912' })
  @Column({ nullable: true })
  site_id: string;

  @ApiProperty({ example: 'Modernization 2026' })
  @Column({ nullable: true })
  project_name: string;

  @ApiProperty({ example: 100 })
  @Column({ type: 'int', default: 0 })
  quantity: number;

  @ApiProperty({ example: 'Units' })
  @Column({ nullable: true })
  unit: string;

  @ApiProperty({ example: 'DO-26-08-011' })
  @Column({ nullable: true })
  delivery_reference: string;

  @ApiProperty({ example: 'Tested and Worked' })
  @Column({ nullable: true })
  condition: string;

  @ApiProperty({ example: 'Additional notes' })
  @Column({ type: 'text', nullable: true })
  notes: string;
}
