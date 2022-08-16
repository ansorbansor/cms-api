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
      'yyyy-MM-D HH:mm:ss',
    );
    this.updatedAtParseDate = moment(this.created_at).format(
      'yyyy-MM-D HH:mm:ss',
    );
    this.deletedAtParseDate = moment(this.created_at).format(
      'yyyy-MM-D HH:mm:ss',
    );
    this.__entity = this.constructor.name;
  }
}
