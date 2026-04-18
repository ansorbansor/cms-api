import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'whatsapp',
  version: '1',
})
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('status')
  getStatus() {
    return this.whatsappService.getStatus();
  }

  @Post('logout')
  async logout() {
    return await this.whatsappService.logout();
  }
}
