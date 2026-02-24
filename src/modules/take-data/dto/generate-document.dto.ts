import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class GenerateDocumentDto {
    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    assignment_id: number;
}
