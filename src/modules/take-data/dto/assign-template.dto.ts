import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class AssignTemplateDto {
    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    @IsNumber()
    site_id: number;

    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    @IsNumber()
    template_id: number;
}
