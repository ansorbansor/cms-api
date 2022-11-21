import {
  Controller,
  Post,
  HttpStatus,
  HttpCode,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClientAuthGuard, JwtAuthGuard } from 'src/utils/guards';
import { successResponse } from 'src/utils/responses';
import { FinishCourseDto } from './dto/finish-course.dto';
import { GeneratePartnerDto } from './dto/generate-partner.dto';
import { PartnerLoginDto } from './dto/partner-login.dto';
import { PartnerService } from './partner.service';

@ApiBearerAuth()
@ApiTags('Partner')
@Controller({
  path: 'partner',
  version: '1',
})
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(@Body() loginDto: PartnerLoginDto) {
    const data = await this.partnerService.validateLogin(loginDto);
    return successResponse(data, 'success');
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  public async generate(@Body() generateDto: GeneratePartnerDto) {
    const data = await this.partnerService.generatePartner(generateDto);
    return successResponse(data, 'success');
  }

  @Post('finish-course')
  @UseGuards(ClientAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async finishCourse(@Body() data: FinishCourseDto) {
    return await this.partnerService.finishCourse(data);
  }
}
