import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt-strategy';
import { JwtRefreshTokenStrategy } from './jwt-refresh-token-strategy';
import { EmailModule } from '../email/email.module';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationCode } from './entities/verification-codes.entity';

@Module({
  imports: [
    UsersModule,
    EmailModule,
    TypeOrmModule.forFeature([VerificationCode]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.get<number>('ACCESS_TOKEN_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [OtpService, AuthService, JwtStrategy, JwtRefreshTokenStrategy],
})
export class AuthModule {}
