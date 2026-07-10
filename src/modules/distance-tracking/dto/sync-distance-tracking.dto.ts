import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class SyncDistanceTrackingDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @IsOptional()
  startTripTime?: number;

  @IsNumber()
  @IsOptional()
  endTripTime?: number;

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
