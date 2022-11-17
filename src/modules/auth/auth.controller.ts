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
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
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
import { successResponse } from 'src/utils/responses';
import { FileInterceptor } from '@nestjs/platform-express';
import { BufferedFile } from 'src/utils/file-helper';
import { AuthUpdatePasswordDto } from './dtos/auth-update-password.dto';
import { JwtAuthGuard } from 'src/utils/guards';
import { Throttle } from '@nestjs/throttler';
import { TwoFactorAuthService } from '../two-factor-auth/two-factor-auth.service';
import { TwoFactorAuthDto } from './dtos/two-factor-auth.dto';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    public service: AuthService,
    public twoFactorAuthService: TwoFactorAuthService,
  ) {}

  @Throttle(5, 300)
  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  public async login(@Request() req, @Body() loginDto: AuthEmailLoginDto) {
    const data = await this.service.validateLogin(loginDto, false, req.ip);

    return successResponse(
      AuthResource(data.token, data.user, data.menus),
      'success',
    );
  }

  @Throttle(5, 300)
  @Post('email/pluto-login')
  @HttpCode(HttpStatus.OK)
  public async loginCustomExpiration(
    @Request() req,
    @Body() loginDto: AuthEmailLoginDto,
  ) {
    const data = await this.service.validateLoginCustomExpiration(
      loginDto,
      false,
      req.ip,
    );
    return successResponse(
      AuthResource(data.token, data.user, data.menus),
      'success',
    );
  }

  @Throttle(5, 300)
  @Post('admin/email/login')
  @HttpCode(HttpStatus.OK)
  public async adminLogin(@Request() req, @Body() loginDto: AuthEmailLoginDto) {
    const data = await this.service.validateLogin(loginDto, true, req.ip);
    return successResponse(
      AuthResource(data.token, data.user, data.menus),
      'success',
    );
  }

  @Throttle(5, 300)
  @Post('google/login')
  @HttpCode(HttpStatus.OK)
  async loginGoogle(@Body() loginDto: AuthGoogleLoginDto) {
    const socialData = await this.service.getProfileByTokenGoogle(loginDto);

    return successResponse(
      await this.service.validateSocialLogin('google', socialData),
      'success',
    );
  }

  @Throttle(5, 300)
  @Post('facebook/login')
  @HttpCode(HttpStatus.OK)
  async loginFacebook(@Body() loginDto: AuthFacebookLoginDto) {
    const socialData = await this.service.getProfileByTokenFacebook(loginDto);

    return successResponse(
      this.service.validateSocialLogin('facebook', socialData),
      'success',
    );
  }

  @Throttle(5, 300)
  @Post('apple/login')
  @HttpCode(HttpStatus.OK)
  async loginApple(@Body() loginDto: AuthAppleLoginDto) {
    const socialData = await this.service.getProfileByTokenApple(loginDto);

    return successResponse(
      this.service.validateSocialLogin('apple', socialData),
      'success',
    );
  }

  @Post('2fa/generate')
  @HttpCode(HttpStatus.OK)
  public async twoFactorAuthGenerate(
    @Body() twoFactorAuthDto: TwoFactorAuthDto,
    @Request() req,
  ) {
    const data =
      await this.twoFactorAuthService.generateTwoFactorAuthenticationSecret(
        twoFactorAuthDto,
        false,
        req.ip,
      );

    return successResponse(data, 'Berhasil generate QR Code 2FA');
  }

  @Throttle(5, 300)
  @Post('/admin/2fa/generate')
  @HttpCode(HttpStatus.OK)
  public async adminTwoFactorAuthGenerate(
    @Body() twoFactorAuthDto: TwoFactorAuthDto,
    @Request() req,
  ) {
    const data =
      await this.twoFactorAuthService.generateTwoFactorAuthenticationSecret(
        twoFactorAuthDto,
        true,
        req.ip,
      );

    return successResponse(data, 'Berhasil generate QR Code 2FA');
  }

  @Post('email/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async register(
    @UploadedFile() file: BufferedFile,
    @Body() createUserDto: AuthRegisterLoginDto,
    @Request() req,
  ) {
    return successResponse(
      this.service.register(file, createUserDto, req.ip),
      'success',
    );
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
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  public async update(
    @Request() request,
    @Body() userDto: AuthUpdateDto,
    @UploadedFile() photo?: BufferedFile,
  ) {
    return successResponse(
      await this.service.update(request.user, userDto, request.ip, photo),
      'success',
    );
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
