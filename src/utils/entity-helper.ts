import { ApiProperty } from '@nestjs/swagger';
import * as moment from 'moment';
import {
  AfterLoad,
  BaseEntity,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class EntityHelper extends BaseEntity {
  __entity?: string;

  @CreateDateColumn()
  created_at: Date;
  createdAtParseDate: string;

  @UpdateDateColumn()
  updated_at: Date;
  updatedAtParseDate: string;

  @DeleteDateColumn()
  deleted_at: Date;
  deletedAtParseDate: string;

  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn('increment')
  id: number;

  @AfterLoad()
  setEntityName() {
    this.createdAtParseDate = moment(this.created_at).format(
      'YYYY-MM-DD hh:mm:ss',
    );
    this.updatedAtParseDate = moment(this.updated_at).format(
      'YYYY-MM-DD hh:mm:ss',
    );
    this.deletedAtParseDate = this.deleted_at
      ? moment(this.deleted_at).format('YYYY-MM-DD hh:mm:ss')
      : null;
    this.__entity = this.constructor.name;
  }
}
