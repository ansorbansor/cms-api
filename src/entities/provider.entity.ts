import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { FileEntity } from './file.entity';

@Entity({ name: 'providers' })
export class Provider extends EntityHelper {
  @Column()
  name: string | null;

  @Column()
  fetch_data: boolean | null;

  @Column()
  photo: number | null;

  @Column()
  last_update: Date | null;

  @Column()
  url: string;

  @OneToOne(() => FileEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'photo' })
  photoFile: FileEntity;
}
