import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { SiteTakeDataAssignment } from './site-take-data-assignment.entity';
import { TakeDataTemplateItem } from './take-data-template-item.entity';
import { FileEntity } from './file.entity';
import { User } from './user.entity';

@Entity({ name: 'take_data_submissions' })
export class TakeDataSubmission extends EntityHelper {
    @ApiProperty({ example: 1 })
    @Column()
    assignment_id: number;

    @ApiProperty({ example: 1 })
    @Column()
    template_item_id: number;

    @ApiProperty({ example: 1 })
    @Column({ nullable: true })
    photo_id: number;

    @ApiProperty({ example: 'Antenna Height: 50m' })
    @Column({ type: 'text', nullable: true })
    text_data: string;

    @OneToOne(() => FileEntity, { eager: true })
    @JoinColumn({ name: 'photo_id' })
    photo: FileEntity;

    @ApiProperty({ example: '-6.2088,106.8456' })
    @Column({ nullable: true })
    coordinate: string;

    @ApiProperty({ example: '2025-01-01 10:00:00' })
    @Column({ nullable: true })
    timestamp: Date;

    @ApiProperty({ example: 1 })
    @Column({ nullable: true })
    submitted_by: number;

    @ManyToOne(() => SiteTakeDataAssignment, (assignment) => assignment.submissions)
    @JoinColumn({ name: 'assignment_id' })
    assignment: SiteTakeDataAssignment;

    @ManyToOne(() => TakeDataTemplateItem)
    @JoinColumn({ name: 'template_item_id' })
    template_item: TakeDataTemplateItem;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'submitted_by' })
    user: User;
}
