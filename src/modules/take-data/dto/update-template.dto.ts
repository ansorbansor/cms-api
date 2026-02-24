import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTakeDataTemplateDto {
    @ApiProperty({ example: 'Survey XL MOCN 2025', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ example: 'Description', required: false })
    @IsOptional()
    @IsString()
    description?: string;
}
