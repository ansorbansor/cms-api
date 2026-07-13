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
  @IsOptional()
  startLat?: number;

  @IsNumber()
  @IsOptional()
  startLng?: number;

  @IsNumber()
  @IsOptional()
  endLat?: number;

  @IsNumber()
  @IsOptional()
  endLng?: number;

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
