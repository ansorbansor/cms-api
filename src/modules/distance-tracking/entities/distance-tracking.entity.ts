import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'src/entities/user.entity';

@Entity('distance_trackings')
export class DistanceTracking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'float', name: 'total_distance' })
  totalDistance: number;

  @Column({ type: 'int', name: 'mock_attempts', default: 0 })
  mockAttempts: number;

  @Column({ type: 'float', name: 'max_speed', default: 0 })
  maxSpeed: number;

  @Column({ type: 'bigint', nullable: true, name: 'start_trip_time' })
  startTripTime: number;

  @Column({ type: 'bigint', nullable: true, name: 'end_trip_time' })
  endTripTime: number;

  @Column({ type: 'float', nullable: true, name: 'start_lat' })
  startLat: number;

  @Column({ type: 'float', nullable: true, name: 'start_lng' })
  startLng: number;

  @Column({ type: 'float', nullable: true, name: 'end_lat' })
  endLat: number;

  @Column({ type: 'float', nullable: true, name: 'end_lng' })
  endLng: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
