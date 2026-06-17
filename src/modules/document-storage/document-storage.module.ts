import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentStorageEntity } from 'src/entities/document-storage.entity';
import { DocumentStorageService } from './document-storage.service';
import { DocumentStorageController } from './document-storage.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentStorageEntity]), UsersModule],
  providers: [DocumentStorageService],
  controllers: [DocumentStorageController],
})
export class DocumentStorageModule {}
