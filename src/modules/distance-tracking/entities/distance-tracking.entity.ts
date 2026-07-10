import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('distance_trackings')
export class DistanceTracking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number; // Assuming the token contains the user ID and we extract it

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
