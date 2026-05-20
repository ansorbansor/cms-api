import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTakeDataTemplateItemDto {
    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    template_id: number;

    @ApiProperty({ example: 'Depan' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: 'photo' })
    @IsOptional()
    @IsString()
    type?: string;

    @ApiProperty({ example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    sample_photo_id?: number;

    @ApiProperty({ example: 3 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    min_photos?: number;

    @ApiProperty({ example: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    order?: number;
}
