import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { OtpService } from './otp.service';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';
import { JwtRefreshGuard } from './jwt-refresh-token-guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly otpService: OtpService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, password } = body;
    const result = await this.authService.login(email, password);

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { refresh_token, ...responseData } = result;
    return responseData;
  }

  @Post('request-otp')
  async requestOtp(@Body() body: any) {
    const { email, type } = body;
    return this.otpService.requestOtp(email, type);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: any) {
    const { email, otp, type } = body;
    return this.otpService.verifyOtp(email, otp, type);
  }

  @Post('request-password-reset')
  async requestPasswordReset(@Body() body: any) {
    const { resetToken, newPassword } = body;

    return this.authService.resetPassword(resetToken, newPassword);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh-token')
  async refreshToken(@Req() req, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.sub;
    const refreshToken = req.user.refresh_token;

    const result = await this.authService.refreshToken(userId, refreshToken);

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { refresh_token, ...responseData } = result;
    return responseData;
  }

  @UseGuards(JwtRefreshGuard)
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.sub;
    
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    await this.authService.logout(userId);

    return { message: 'Logged out successfully' };
  }
}
