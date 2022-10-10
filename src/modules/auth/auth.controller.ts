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
import { successResponse } from 'src/utils/responses';
import { FileInterceptor } from '@nestjs/platform-express';
import { BufferedFile } from 'src/utils/file-helper';

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

  @Post('google/login')
  @HttpCode(HttpStatus.OK)
  async loginGoogle(@Body() loginDto: AuthGoogleLoginDto) {
    const socialData = await this.service.getProfileByTokenGoogle(loginDto);

    return successResponse(
      this.service.validateSocialLogin('google', socialData),
      'success',
    );
  }

  @Post('facebook/login')
  @HttpCode(HttpStatus.OK)
  async loginFacebook(@Body() loginDto: AuthFacebookLoginDto) {
    const socialData = await this.service.getProfileByTokenFacebook(loginDto);

    return successResponse(
      this.service.validateSocialLogin('facebook', socialData),
      'success',
    );
  }

  @Post('apple/login')
  @HttpCode(HttpStatus.OK)
  async loginApple(@Body() loginDto: AuthAppleLoginDto) {
    const socialData = await this.service.getProfileByTokenApple(loginDto);

    return successResponse(
      this.service.validateSocialLogin('apple', socialData),
      'success',
    );
  }

  @Post('email/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async register(
    @UploadedFile() file: BufferedFile,
    @Body() createUserDto: AuthRegisterLoginDto,
  ) {
    return successResponse(
      this.service.register(file, createUserDto),
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
      await this.service.forgotPassword(forgotPasswordDto.email, req.ip),
      'success',
    );
  }

  @Post('reset/password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: AuthResetPasswordDto) {
    return successResponse(
      this.service.resetPassword(
        resetPasswordDto.hash,
        resetPasswordDto.password,
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
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  public async me(@Request() request) {
    return successResponse(await this.service.me(request.user), 'success');
  }

  @ApiBearerAuth()
  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  public async update(
    @Request() request,
    @Body() userDto: AuthUpdateDto,
    @UploadedFile() photo?: BufferedFile,
  ) {
    return successResponse(
      await this.service.update(request.user, userDto, photo),
      'success',
    );
  }

  @ApiBearerAuth()
  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  public async delete(@Request() request) {
    return successResponse(this.service.softDelete(request.user), 'success');
  }
}
