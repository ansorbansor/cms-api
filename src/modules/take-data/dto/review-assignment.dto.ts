import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class ReviewAssignmentDto {
    @ApiProperty({
        example: {
            "1": { "status": "Passed", "remarks": "" },
            "2": { "status": "Rejected", "remarks": "Blurry photo" }
        }
    })
    @IsNotEmpty()
    @IsObject()
    item_reviews: Record<number, { status: 'Passed' | 'Rejected', remarks: string }>;
}
