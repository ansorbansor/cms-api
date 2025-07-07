import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdateBiddingAreaDTO {
  @ApiProperty({ example: 'Bali, Pulau Lombok' })
  @IsNotEmpty({ message: 'Nama Bidding Area tidak boleh kosong' })
  @Validate(IsNotExist, ['BiddingArea'], {
    message: 'Bidding Area Name telah terdaftar',
  })
  name: string;
}
