import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class CreateBiddingAreaDTO {
  @ApiProperty({ example: 'Bali, Pulau Lombok' })
  @IsNotEmpty({ message: 'Bidding Area tidak boleh kosong' })
  @Validate(IsNotExist, ['BiddingArea'], {
    message: 'Bidding Area telah terdaftar',
  })
  name: string;
}
