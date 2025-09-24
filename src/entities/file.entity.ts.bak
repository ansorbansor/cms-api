import {
  Column,
  Entity,
  AfterLoad,
  AfterInsert,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import appConfig from 'src/config/app.config';
import { User } from './user.entity';

@Entity({ name: 'files' })
export class FileEntity extends EntityHelper {
  @Column()
  name: string;

  @Column()
  file_type: number;

  @Column()
  extension: string;

  @Column()
  description: string;

  @Column()
  path: string;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @AfterLoad()
  @AfterInsert()
  updatePath() {
    if (this.path.indexOf('/') === 0) {
      this.path = appConfig().backendDomain + this.path;
    }
  }
}
