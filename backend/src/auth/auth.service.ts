import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { VerificationCodeType } from './entities/verification-codes.entity';
import { SocialAccountsService } from './social_accounts.service';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { ProfileDto } from '@/users/dto/profile.dto';
import { User } from '@/users/entities/user.entity';
import type { StringValue } from 'ms';
import { UserResponseDto } from '@/users/dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager } from 'typeorm';

const parseExpiresIn = (value?: string): number | StringValue | undefined => {
  if (!value) {
    return undefined;
  }

  return /^\d+$/.test(value) ? Number(value) : (value as StringValue);
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly socialAccountsService: SocialAccountsService,
    private readonly dataSource: DataSource,
  ) {}

  private hashString(str: string): string {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(str, salt);
  }

  private generateToken(payload: any, type: 'access' | 'refresh') {
    if (type === 'access') {
      return this.jwtService.sign(payload, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: parseExpiresIn(
          this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN'),
        ),
      });
    }

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: parseExpiresIn(
        this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN'),
      ),
    });
  }

  async register(registerDto: RegisterDto) {
    return this.dataSource.transaction(async (manager) => {
      const { email, username, password } = registerDto;

      const existingEmail = await this.usersService.findOneByEmailRaw(
        email,
        manager,
      );
      if (existingEmail) {
        throw new BadRequestException('Email already in use');
      }

      const existingUsername = await this.usersService.findOneByUsernameRaw(
        username,
        manager,
      );
      if (existingUsername) {
        throw new BadRequestException('Username already in use');
      }

      const hashedPassword = this.hashString(password);

      const newUser = await this.usersService.create(
        {
          email,
          username,
          password: hashedPassword,
        },
        undefined,
        manager,
      );

      await this.otpService.requestOtp(
        email,
        VerificationCodeType.EMAIL_VERIFICATION,
        manager,
      );

      return {
        message:
          'User registered successfully. Please check your email to verify your account.',
        user: plainToInstance(UserResponseDto, newUser, {
          excludeExtraneousValues: true,
        }),
      };
    });
  }

  async login(email: string, password: string) {
    return this.dataSource.transaction(async (manager) => {
      const user = await this.usersService.findOneByEmailRaw(email, manager);

      if (!user) {
        throw new BadRequestException('Invalid email or password');
      }

      if (!user.is_verified) {
        throw new BadRequestException(
          'Email not verified. Please verify your email before logging in.',
        );
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        throw new BadRequestException('Invalid email or password');
      }

      const payload = {
        sub: user.id,
        email: user.email,
        username: user.username,
      };

      const [access_token, refresh_token] = await Promise.all([
        this.generateToken(payload, 'access'),
        this.generateToken(payload, 'refresh'),
      ]);

      await this.usersService.updateUser(
        user.id,
        {
          refresh_token: this.hashString(refresh_token),
        },
        manager,
      );

      return {
        message: 'Login successful',
        user: plainToInstance(UserResponseDto, user, {
          excludeExtraneousValues: true,
        }),
        access_token,
        refresh_token,
      };
    });
  }

  async logout(userId: string) {
    await this.usersService.updateUser(
      userId,
      { refresh_token: null },
    );
    return { message: 'Logout successful' };
  }

  async refreshToken(
    userId: string,
    refreshToken: string,
  ) {
    const user = await this.usersService.findOneByIdRaw(userId);

    if (!user || !user.refresh_token) {
      throw new BadRequestException('Invalid refresh token');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refresh_token,
    );

    if (!isRefreshTokenValid) {
      throw new BadRequestException('Invalid refresh token');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const [access_token, new_refresh_token] = await Promise.all([
      this.generateToken(payload, 'access'),
      this.generateToken(payload, 'refresh'),
    ]);

    await this.usersService.updateUser(
      user.id,
      {
        refresh_token: this.hashString(new_refresh_token),
      },
    );

    return {
      access_token,
      refresh_token: new_refresh_token,
    };
  }

  async resetPassword(
    resetToken: string,
    newPassword: string,
  ) {
    const decoded = await this.jwtService.verifyAsync(resetToken, {
      secret: this.configService.get<string>('RESET_PASSWORD_TOKEN_SECRET'),
    });

    const user = await this.usersService.findOneByEmailRaw(
      decoded.email,
    );

    if (!user) {
      throw new BadRequestException('Invalid reset token');
    }

    const hashedPassword = this.hashString(newPassword);
    await this.usersService.updateUser(
      user.id,
      { password: hashedPassword },
    );

    return {
      message:
        'Password reset successful. Please log in with your new password.',
    };
  }

  async validateSocialUser(user: any) {
    return this.dataSource.transaction(async (manager) => {
      const { provider, providerUserId, email, username, avatar } = user;

      if (!email) {
        throw new BadRequestException('Email is required for social login');
      }

      const existingUser = await this.usersService.findOneByEmailRaw(
        email,
        manager,
      );

      let finalUser: Pick<User, 'id' | 'email' | 'username'>;

      if (existingUser) {
        if (
          !existingUser.socialAccounts.some(
            (account) =>
              account.provider === provider &&
              account.provider_user_id === providerUserId,
          )
        ) {
          await this.socialAccountsService.create(
            {
              provider,
              provider_user_id: providerUserId,
              user_id: existingUser.id,
            },
            manager,
          );
        }

        if (!existingUser.profile?.avatar_url && avatar) {
          await this.usersService.updateProfile(
            existingUser.id,
            {
              avatar_url: avatar,
            },
            undefined,
            undefined,
            manager,
          );
        }

        finalUser = existingUser as UserResponseDto;
      } else {
        const userInfo: CreateUserDto = {
          email,
          username,
          is_verified: true,
        };

        const profileInfo: ProfileDto = {
          avatar_url: avatar,
        };

        const createdUser = await this.usersService.create(
          userInfo,
          profileInfo,
          manager,
        );

        await this.socialAccountsService.create(
          {
            provider,
            provider_user_id: providerUserId,
            user_id: createdUser.id,
          },
          manager,
        );

        finalUser = createdUser as UserResponseDto;
      }

      const payload = {
        sub: finalUser.id,
        email: finalUser.email,
        username: finalUser.username,
      };

      const [access_token, refresh_token] = await Promise.all([
        this.generateToken(payload, 'access'),
        this.generateToken(payload, 'refresh'),
      ]);

      await this.usersService.updateUser(
        finalUser.id,
        {
          refresh_token: this.hashString(refresh_token),
        },
        manager,
      );

      return {
        user: plainToInstance(UserResponseDto, finalUser, {
          excludeExtraneousValues: true,
        }),
        access_token,
        refresh_token,
      };
    });
  }
}
