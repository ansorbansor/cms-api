import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Site } from './site.entity';
import { TakeDataTemplate } from './take-data-template.entity';
import { TakeDataSubmission } from './take-data-submission.entity';
import { User } from './user.entity';

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

    @ApiProperty({ example: 'My Custom Watermark' })
    @Column({ nullable: true, type: 'text' })
    custom_watermark: string;

    @ApiProperty({ example: 'pending' })
    @Column({ default: 'pending' })
    review_status: string;

    @ApiProperty({ example: '{"1": {"status": "Passed"}}' })
    @Column({ nullable: true, type: 'text' })
    item_reviews: string;

    @ApiProperty({ example: 1 })
    @Column({ nullable: true })
    reviewed_by: number;

    @ApiProperty({ example: '2025-01-01 10:00:00' })
    @Column({ nullable: true })
    reviewed_at: Date;

    @ManyToOne(() => Site)
    @JoinColumn({ name: 'site_id' })
    site: Site;

    @ManyToOne(() => TakeDataTemplate, (template) => template.assignments)
    @JoinColumn({ name: 'template_id' })
    template: TakeDataTemplate;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'reviewed_by' })
    reviewer: User;

    @OneToMany(() => TakeDataSubmission, (submission) => submission.assignment)
    submissions: TakeDataSubmission[];
}
