import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTakeDataTemplateDto {
    @ApiProperty({ example: 'Survey XL MOCN 2025' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: 'Description' })
    @IsOptional()
    @IsString()
    description?: string;
}
