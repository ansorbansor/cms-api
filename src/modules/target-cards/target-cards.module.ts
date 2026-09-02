import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TargetCardsController } from './target-cards.controller';
import { TargetCardsService } from './target-cards.service';
import { TargetCard } from '../../entities/target-card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TargetCard])],
  controllers: [TargetCardsController],
  providers: [TargetCardsService],
  exports: [TargetCardsService],
})
export class TargetCardsModule {}
