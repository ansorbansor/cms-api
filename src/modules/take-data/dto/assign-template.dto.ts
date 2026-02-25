import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AssignTemplateDto {
    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    @IsNumber()
    site_id: number;

    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    @IsNumber()
    template_id: number;

    @ApiProperty({ example: 'My Custom Watermark', required: false })
    @IsOptional()
    @IsString()
    custom_watermark?: string;
}
