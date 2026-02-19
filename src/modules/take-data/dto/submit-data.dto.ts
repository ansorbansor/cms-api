import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SubmitTakeDataDto {
    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    @IsNumber()
    assignment_id: number;

    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    @IsNumber()
    template_item_id: number;

    @ApiProperty({ type: 'string', format: 'binary' })
    photo: any;

    @ApiProperty({ example: '-6.2088,106.8456' })
    @IsOptional()
    @IsString()
    coordinate?: string;

    @ApiProperty({ example: '2025-01-01 10:00:00' })
    @IsOptional()
    timestamp?: Date;
}
