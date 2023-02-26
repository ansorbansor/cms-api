import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Request,
  Post,
  UseGuards,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from 'src/modules/auth/auth.service';
import { AuthConfirmEmailDto } from 'src/modules/auth/dtos/auth-confirm-email.dto';
import { AuthEmailLoginDto } from './dtos/auth-email-login.dto';
import { AuthForgotPasswordDto } from './dtos/auth-forgot-password.dto';
import { AuthResetPasswordDto } from './dtos/auth-reset-password.dto';
import { AuthResource } from './resources/auth.resources';
import { successResponse } from 'src/utils/responses';
import { AuthUpdatePasswordDto } from './dtos/auth-update-password.dto';
import { JwtAuthGuard } from 'src/utils/guards';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(public service: AuthService) {}

  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  public async login(@Request() req, @Body() loginDto: AuthEmailLoginDto) {
    const data = await this.service.validateLogin(loginDto, false, req.ip);

    return successResponse(AuthResource(data.token, data.user), 'success');
  }

  @Post('admin/email/login')
  @HttpCode(HttpStatus.OK)
  public async adminLogin(@Request() req, @Body() loginDto: AuthEmailLoginDto) {
    const data = await this.service.validateLogin(loginDto, true, req.ip);
    return successResponse(AuthResource(data.token, data.user), 'success');
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmEmail(@Body() confirmEmailDto: AuthConfirmEmailDto) {
    return successResponse(
      this.service.confirmEmail(confirmEmailDto.hash),
      'success',
    );
  }

  @Post('forgot/password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: AuthForgotPasswordDto,
    @Request() req,
  ) {
    return successResponse(
      await this.service.forgotPassword(forgotPasswordDto.email, req.ip, false),
      'success',
    );
  }

  @Post('admin/forgot/password')
  @HttpCode(HttpStatus.OK)
  async adminForgotPassword(
    @Body() forgotPasswordDto: AuthForgotPasswordDto,
    @Request() req,
  ) {
    return successResponse(
      await this.service.forgotPassword(forgotPasswordDto.email, req.ip, true),
      'success',
    );
  }

  @Post('reset/password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: AuthResetPasswordDto,
    @Request() req,
  ) {
    return successResponse(
      await this.service.resetPassword(
        resetPasswordDto.hash,
        resetPasswordDto.password,
        req.ip,
      ),
      'success',
    );
  }

  @Get('reset/password')
  @HttpCode(HttpStatus.OK)
  async resetPasswordData(@Query('hash') hash: string) {
    return successResponse(
      await this.service.resetPasswordData(hash),
      'success',
    );
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  public async me(@Request() request) {
    return successResponse(await this.service.me(request.user), 'success');
  }

  @ApiBearerAuth()
  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  public async updatePassword(
    @Request() request,
    @Body() userDto: AuthUpdatePasswordDto,
  ) {
    return successResponse(
      await this.service.changePassword(request.user, userDto),
      'success',
    );
  }

  @ApiBearerAuth()
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  public async delete(@Request() request) {
    return successResponse(
      this.service.softDelete(request.user, request.ip),
      'success',
    );
  }

  @Get('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req) {
    return successResponse(
      await this.service.logout(req.user, req.ip),
      'success',
    );
  }
}
