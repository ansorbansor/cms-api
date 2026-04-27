import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskNamePreset } from '../../entities/task-name-preset.entity';
import { TaskNamePresetsController } from './task-name-presets.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([TaskNamePreset]), UsersModule],
  controllers: [TaskNamePresetsController],
  exports: [TypeOrmModule],
})
export class TaskNamePresetsModule {}
