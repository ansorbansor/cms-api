import { AfterLoad, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';
import * as moment from 'moment';
import { FileEntity } from './file.entity';

@Entity({ name: 'absence' })
export class Absence extends EntityHelper {
  @Column()
  user_id?: number;

  @Column()
  clock_in?: Date;

  @Column()
  clock_out?: Date;

  @Column()
  clock_in_photo?: number;

  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'clock_in_photo' })
  clock_in_photo_file: FileEntity;

  @Column()
  clock_out_photo?: number;

  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'clock_out_photo' })
  clock_out_photo_file: FileEntity;

  @Column()
  clock_in_latitude?: number;

  @Column()
  clock_in_longitude?: number;

  @Column()
  clock_out_latitude?: number;

  @Column()
  clock_out_longitude?: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  clockInParseDate: string;
  clockOutParseDate: string;

  @AfterLoad()
  setEntityName() {
    this.clockInParseDate = this.clock_in
      ? moment(this.clock_in).format('YYYY-MM-DD HH:mm:ss')
      : null;
    this.clockOutParseDate = this.clock_out
      ? moment(this.clock_out).format('YYYY-MM-DD HH:mm:ss')
      : null;
    this.__entity = this.constructor.name;
  }
}
