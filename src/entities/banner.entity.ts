import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { FileEntity } from './file.entity';

@Entity({ name: 'banners' })
export class Banner extends EntityHelper {
  @Column()
  name: string;

  @Column()
  type: number;

  @Column()
  course_id: number;

  @Column()
  content: string;

  @Column()
  external_url: string;

  @Column()
  photo: number;

  @Column()
  position: number;

  @Column()
  status: boolean;

  @OneToOne(() => FileEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'photo' })
  photoFile: FileEntity;
}
