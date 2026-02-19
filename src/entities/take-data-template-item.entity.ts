import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { TakeDataTemplate } from './take-data-template.entity';
import { FileEntity } from './file.entity';

@Entity({ name: 'take_data_template_items' })
export class TakeDataTemplateItem extends EntityHelper {
    @ApiProperty({ example: 1 })
    @Column()
    template_id: number;

    @ApiProperty({ example: 'Depan' })
    @Column()
    name: string;

    @ApiProperty({ example: 1 })
    @Column({ nullable: true })
    sample_photo_id: number;

    @OneToOne(() => FileEntity, { eager: true })
    @JoinColumn({ name: 'sample_photo_id' })
    sample_photo: FileEntity;

    @ApiProperty({ example: 3 })
    @Column({ default: 3 })
    min_photos: number;

    @ApiProperty({ example: 1 })
    @Column({ default: 0 })
    order: number;

    @ManyToOne(() => TakeDataTemplate, (template) => template.items)
    @JoinColumn({ name: 'template_id' })
    template: TakeDataTemplate;
}
