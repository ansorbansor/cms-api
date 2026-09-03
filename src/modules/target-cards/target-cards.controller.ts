import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch } from '@nestjs/common';
import { TargetCardsService } from './target-cards.service';
import { JwtAuthGuard, RolesGuard } from '../../utils/guards';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'target-cards', version: '1' })
export class TargetCardsController {
  constructor(private readonly targetCardsService: TargetCardsService) {}

  @Post()
  create(@Body() createTargetCardDto: any) {
    return this.targetCardsService.create(createTargetCardDto);
  }

  @Get()
  findAll() {
    return this.targetCardsService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTargetCardDto: any) {
    return this.targetCardsService.update(+id, updateTargetCardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.targetCardsService.remove(+id);
  }
}
