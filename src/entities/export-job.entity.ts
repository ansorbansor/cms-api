import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'export_jobs' })
export class ExportJob extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    user_id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 50 })
    type: string; // 'PO', 'SPK', etc.

    @Column({ type: 'varchar', length: 20, default: 'PENDING' })
    status: string; // 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'

    @Column({ type: 'text', nullable: true })
    file_path: string; // Local path to file

    @Column({ type: 'text', nullable: true })
    payload: string; // JSON string of arguments

    @Column({ type: 'text', nullable: true })
    error_message: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
