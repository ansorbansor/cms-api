import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTakeDataTemplateItemDto {
    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    @IsNumber()
    template_id: number;

    @ApiProperty({ example: 'Depan' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: 1 })
    @IsOptional()
    @IsNumber()
    sample_photo_id?: number;

    @ApiProperty({ example: 3 })
    @IsOptional()
    @IsNumber()
    min_photos?: number;

    @ApiProperty({ example: 0 })
    @IsOptional()
    @IsNumber()
    order?: number;
}
