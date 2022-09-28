import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators';

export class UpdateProviderDto {
  @ApiProperty()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 'Mooc A' })
  @Validate(IsNotExist, ['Provider', 'name', 'id'], {
    message: 'Nama penyelenggara sudah ada',
  })
  @IsNotEmpty()
  name: string | null;

  @ApiProperty({ type: 'string', format: 'binary' })
  photo: any;

  @ApiProperty({ example: 'https://www.udemy.com' })
  @IsNotEmpty()
  url: string;
}
