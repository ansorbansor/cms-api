import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTakeDataTemplateItemDto {
    @ApiProperty({ example: 'Depan', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ example: 'photo', required: false })
    @IsOptional()
    @IsString()
    type?: string;

    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    sample_photo_id?: number | null;

    @ApiProperty({ example: 3, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    min_photos?: number;

    @ApiProperty({ example: 0, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    order?: number;
}
