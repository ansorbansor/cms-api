import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from 'src/entities/file.entity';
import { FilesController } from 'src/modules/files/files.controller';
import { FilesService } from 'src/modules/files/files.service';
import { User } from 'src/entities/user.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([FileEntity, User])],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
