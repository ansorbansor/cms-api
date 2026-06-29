import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class SyncDistanceTrackingDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @IsNotEmpty()
  totalDistance: number;

  @IsNumber()
  @IsNotEmpty()
  mockAttempts: number;

  @IsNumber()
  @IsNotEmpty()
  maxSpeed: number;
}
