import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from 'src/entities/inventory.entity';
import { User } from 'src/entities/user.entity'; // Import the User entity
import { FilesModule } from '../files/files.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  // ✅ FIX: Add the User entity here.
  // This makes UserRepository available to be injected into InventoryService.
  imports: [TypeOrmModule.forFeature([Inventory, User]), FilesModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}

