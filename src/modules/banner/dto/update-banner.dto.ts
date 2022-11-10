import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, NotEquals, Validate } from 'class-validator';
import { BannerType } from 'src/utils/enums';
import { IsNotExist } from 'src/utils/validators';

export class UpdateBannerDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'ID Banner tidak boleh kosong' })
  id: number;

  @ApiProperty({ example: 'Banner A' })
  @Validate(IsNotExist, ['Banner', 'name'], {
    message: 'Nama banner sudah ada',
  })
  @IsNotEmpty({ message: 'Nama banner tidak boleh kosong' })
  name: string;

  @ApiProperty({ example: 0 })
  @IsNotEmpty({ message: 'Tipe Banner tidak boleh kosong' })
  @NotEquals(
    [BannerType.COURSE, BannerType.ANNOUNCEMENT, BannerType.EXTERNAL_URL],
    {
      message: 'Tipe tidak tersedia',
    },
  )
  type: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  course_id: number;

  @ApiProperty({ example: '<h1>Lorem ipsum</h1>' })
  @IsOptional()
  content: string;

  @ApiProperty({ example: 'https://playbook.setneg.go.id' })
  @IsOptional()
  external_url: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  @IsOptional()
  photo: any;

  @ApiProperty({ example: 1 })
  @IsOptional()
  position: number;

  @ApiProperty({ example: true })
  @IsNotEmpty({ message: 'Status banner tidak boleh kosong' })
  @Transform(({ value }) => (value === 'true' ? 1 : 0))
  status: number;
}
