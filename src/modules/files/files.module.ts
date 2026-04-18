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
                // Preserve original filename but sanitize spaces and special chars
                const sanitized = file.originalname
                  .replace(/\s+/g, '_')
                  .replace(/[^a-zA-Z0-9._-]/g, '');
                const uniquePrefix = randomStringGenerator().substring(0, 8);
                callback(null, `${uniquePrefix}_${sanitized}`);
              },
            }),
        };

        return {
          fileFilter: (request, file, callback) => {
            // Accept all file types
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
