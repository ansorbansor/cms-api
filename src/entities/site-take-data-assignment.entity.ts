import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Site } from './site.entity';
import { TakeDataTemplate } from './take-data-template.entity';
import { TakeDataSubmission } from './take-data-submission.entity';

@Entity({ name: 'site_take_data_assignments' })
export class SiteTakeDataAssignment extends EntityHelper {
    @ApiProperty({ example: 1 })
    @Column()
    site_id: number;

    @ApiProperty({ example: 1 })
    @Column()
    template_id: number;

    @ApiProperty({ example: 'pending' })
    @Column({ default: 'pending' })
    status: string;

    @ApiProperty({ example: 0 })
    @Column({ default: 0, type: 'float' })
    progress: number;

    @ApiProperty({ example: 1 })
    @Column({ nullable: true })
    assigned_by: number;

    @ManyToOne(() => Site)
    @JoinColumn({ name: 'site_id' })
    site: Site;

    @ManyToOne(() => TakeDataTemplate, (template) => template.assignments)
    @JoinColumn({ name: 'template_id' })
    template: TakeDataTemplate;

    @OneToMany(() => TakeDataSubmission, (submission) => submission.assignment)
    submissions: TakeDataSubmission[];
}
