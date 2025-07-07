import { Global, HttpException, HttpStatus, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from 'src/entities/file.entity';
import { FilesController } from 'src/modules/files/files.controller';
import { FilesService } from 'src/modules/files/files.service';
import { User } from 'src/entities/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity, User]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const storages = {
          local: () =>
            diskStorage({
              destination: './files',
              filename: (request, file, callback) => {
                callback(
                  null,
                  `${randomStringGenerator()}.${file.originalname
                    .split('.')
                    .pop()
                    .toLowerCase()}`,
                );
              },
            }),
        };

        return {
          fileFilter: (request, file, callback) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|xlsx|xls)$/i)) {
              return callback(
                new HttpException(
                  {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                      file: `cantUploadFileType`,
                    },
                  },
                  HttpStatus.UNPROCESSABLE_ENTITY,
                ),
                false,
              );
            }

            callback(null, true);
          },
          storage: storages[configService.get('file.driver')](),
          limits: {
            fileSize: configService.get('file.maxFileSize'),
          },
        };
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService, MulterModule],
})
export class FilesModule {}
