import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Column, Entity, OneToMany } from 'typeorm';
import { TakeDataTemplateItem } from './take-data-template-item.entity';
import { SiteTakeDataAssignment } from './site-take-data-assignment.entity';

@Entity({ name: 'take_data_templates' })
export class TakeDataTemplate extends EntityHelper {
    @ApiProperty({ example: 'Survey XL MOCN 2025' })
    @Column()
    name: string;

    @ApiProperty({ example: 'Description of the template' })
    @Column({ nullable: true })
    description: string;

    @ApiProperty({ example: 1 })
    @Column({ nullable: true })
    created_by: number;

    @OneToMany(() => TakeDataTemplateItem, (item) => item.template)
    items: TakeDataTemplateItem[];

    @OneToMany(() => SiteTakeDataAssignment, (assignment) => assignment.template)
    assignments: SiteTakeDataAssignment[];
}
