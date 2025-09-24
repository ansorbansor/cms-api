import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from 'src/entities/inventory.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { FilesModule } from '../files/files.module'; // Import FilesModule to handle file uploads

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventory]), // Register Inventory entity with TypeORM
    FilesModule, // Import FilesModule so FilesService is available in InventoryService
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
