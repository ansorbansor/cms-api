import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsOptional,
  Validate,
  ValidateNested,
} from 'class-validator';
import { FileEntity } from 'src/entities/file.entity';
import { CreateUserTopicDto } from 'src/modules/users/dto/create-user-topic.dto';
import { IsExist } from 'src/utils/validators';

export class AuthUpdateDto {
  @IsOptional()
  @Validate(IsExist, ['FileEntity', 'id'], {
    message: 'imageNotExists',
  })
  photoFile?: FileEntity | null;

  @ApiProperty({ example: 'john.tor@example.com' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsOptional()
  @IsEmail({}, { message: 'Format email salah' })
  email: string | null;

  @ApiProperty()
  @ValidateNested({
    each: true,
  })
  @IsOptional()
  @IsArray()
  @Type(() => CreateUserTopicDto)
  topics: CreateUserTopicDto[];
}
