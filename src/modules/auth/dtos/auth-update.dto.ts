import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Validate,
  ValidateNested,
} from 'class-validator';
import { FileEntity } from 'src/entities/file.entity';
import { CreateUserTopicDto } from 'src/modules/users/dto/create-user-topic.dto';
import { IsExist } from 'src/utils/validators';

export class AuthUpdateDto {
  @ApiProperty({ example: 'Jane' })
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ example: 'Password9' })
  @IsOptional()
  @IsNotEmpty()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: 'Password9' })
  @IsOptional()
  oldPassword: string;

  @IsOptional()
  @Validate(IsExist, ['FileEntity', 'id'], {
    message: 'imageNotExists',
  })
  photoFile?: FileEntity | null;

  @ApiProperty()
  @ValidateNested({
    each: true,
  })
  @IsArray()
  @Type(() => CreateUserTopicDto)
  categories: CreateUserTopicDto[];
}
