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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from 'src/modules/auth/auth.service';
import { AuthConfirmEmailDto } from 'src/modules/auth/dtos/auth-confirm-email.dto';
import { AuthEmailLoginDto } from './dtos/auth-email-login.dto';
import { AuthRegisterLoginDto } from './dtos/auth-register-login.dto';
import { AuthForgotPasswordDto } from './dtos/auth-forgot-password.dto';
import { AuthResetPasswordDto } from './dtos/auth-reset-password.dto';
import { AuthUpdateDto } from './dtos/auth-update.dto';
import { AuthResource } from './resources/auth.resources';
import { AuthGoogleLoginDto } from './dtos/auth-google-login.dto';
import { AuthFacebookLoginDto } from './dtos/auth-facebook-login.dto';
import { AuthAppleLoginDto } from './dtos/auth-apple-login.dto';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(public service: AuthService) {}

  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  public async login(@Body() loginDto: AuthEmailLoginDto) {
    const data = await this.service.validateLogin(loginDto, false);
    return AuthResource(data.token, data.user);
  }

  @Post('admin/email/login')
  @HttpCode(HttpStatus.OK)
  public async adminLogin(@Body() loginDto: AuthEmailLoginDto) {
    const data = await this.service.validateLogin(loginDto, true);
    return AuthResource(data.token, data.user);
  }

  @Post('google/login')
  @HttpCode(HttpStatus.OK)
  async loginGoogle(@Body() loginDto: AuthGoogleLoginDto) {
    const socialData = await this.service.getProfileByTokenGoogle(loginDto);

    return this.service.validateSocialLogin('google', socialData);
  }

  @Post('facebook/login')
  @HttpCode(HttpStatus.OK)
  async loginFacebook(@Body() loginDto: AuthFacebookLoginDto) {
    const socialData = await this.service.getProfileByTokenFacebook(loginDto);

    return this.service.validateSocialLogin('facebook', socialData);
  }

  @Post('apple/login')
  @HttpCode(HttpStatus.OK)
  async loginApple(@Body() loginDto: AuthAppleLoginDto) {
    const socialData = await this.service.getProfileByTokenApple(loginDto);

    return this.service.validateSocialLogin('apple', socialData);
  }

  @Post('email/register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: AuthRegisterLoginDto) {
    return this.service.register(createUserDto);
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmEmail(@Body() confirmEmailDto: AuthConfirmEmailDto) {
    return this.service.confirmEmail(confirmEmailDto.hash);
  }

  @Post('forgot/password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: AuthForgotPasswordDto) {
    return this.service.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset/password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: AuthResetPasswordDto) {
    return this.service.resetPassword(
      resetPasswordDto.hash,
      resetPasswordDto.password,
    );
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  public async me(@Request() request) {
    return await this.service.me(request.user);
  }

  @ApiBearerAuth()
  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  public async update(@Request() request, @Body() userDto: AuthUpdateDto) {
    return this.service.update(request.user, userDto);
  }

  @ApiBearerAuth()
  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  public async delete(@Request() request) {
    return this.service.softDelete(request.user);
  }
}
