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
    if (this.path && this.path.indexOf('/') === 0) {
      let domain = (appConfig().backendDomain || '').trim();
      if (domain.startsWith('https//')) {
        domain = domain.replace('https//', 'https://');
      } else if (domain.startsWith('http//')) {
        domain = domain.replace('http//', 'http://');
      }
      this.path = domain + this.path;
    }
  }
}
