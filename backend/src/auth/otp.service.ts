import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import {
  VerificationCode,
  VerificationCodeType,
} from './entities/verification-codes.entity';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  private readonly MAX_VERIFICATION_ATTEMPTS = 5;

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getVerificationCodeRepository(manager?: EntityManager) {
    return (
      manager?.getRepository(VerificationCode) ??
      this.verificationCodeRepository
    );
  }

  private executeTransaction<T>(
    manager: EntityManager | undefined,
    callback: (transactionManager: EntityManager) => Promise<T>,
  ) {
    return manager ? callback(manager) : this.dataSource.transaction(callback);
  }

  async requestOtp(
    email: string,
    type: VerificationCodeType,
    manager?: EntityManager,
  ) {
    return this.executeTransaction(manager, async (transactionManager) => {
      const verificationCodeRepository =
        this.getVerificationCodeRepository(transactionManager);

      // Invalidate any existing unused codes for this email and type
      await verificationCodeRepository.update(
        { email, type, is_used: false },
        { is_used: true },
      );

      const code = this.generateOtp();
      const expires_at = new Date(Date.now() + 5 * 60 * 1000);

      const verificationCode = await verificationCodeRepository.create({
        email,
        code,
        type,
        expires_at,
      });

      await this.emailService.sendVerificationEmail(email, code);

      await verificationCodeRepository.save(verificationCode);

      return { message: `Otp sent to ${email}` };
    });
  }

  // Helper method to increment verification attempts
  private async incrementVerificationAttempts(
    email: string,
    type: VerificationCodeType,
    manager?: EntityManager,
  ) {
    const verificationCodeRepository =
      this.getVerificationCodeRepository(manager);

    // Find the most recent active code for this email and type
    const verificationCode = await verificationCodeRepository.findOne({
      where: { email, type, is_used: false },
      order: { created_at: 'DESC' },
    });

    // If a code exists, increment the attempts count
    if (verificationCode) {
      verificationCode.attempts_count += 1;
      await verificationCodeRepository.save(verificationCode);
    }
  }

  async verifyOtp(
    email: string,
    code: string,
    type: VerificationCodeType,
    manager?: EntityManager,
  ) {
    return this.executeTransaction(manager, async (transactionManager) => {
      if (
        type !== VerificationCodeType.EMAIL_VERIFICATION &&
        type !== VerificationCodeType.PASSWORD_RESET
      ) {
        throw new BadRequestException('Invalid verification type');
      }

      const verificationCodeRepository =
        this.getVerificationCodeRepository(transactionManager);

      const verificationCode = await verificationCodeRepository.findOne({
        where: { email, type, is_used: false },
        order: { created_at: 'DESC' },
      });

      // If no active code found, throw an error
      if (!verificationCode) {
        throw new NotFoundException(
          'No active verification code found for this email',
        );
      }

      // Check if the code has expired
      if (verificationCode.expires_at < new Date()) {
        throw new BadRequestException('Verification code has expired');
      }

      // Check if the provided code matches the stored code
      if (verificationCode.code !== code) {
        await this.incrementVerificationAttempts(
          email,
          type,
          transactionManager,
        );
        throw new BadRequestException('Invalid verification code');
      }

      // Check if the maximum number of attempts has been reached
      if (verificationCode.attempts_count >= this.MAX_VERIFICATION_ATTEMPTS) {
        verificationCode.is_used = true;
        await verificationCodeRepository.save(verificationCode);
        throw new BadRequestException(
          'Too many failed attempts. Please request a new verification code.',
        );
      }

      // Mark the code as used
      verificationCode.is_used = true;
      await verificationCodeRepository.save(verificationCode);

      if (type === VerificationCodeType.EMAIL_VERIFICATION) {
        const user = await this.usersService.findOneByEmailRaw(
          email,
          transactionManager,
        );

        if (!user) {
          throw new NotFoundException('User not found');
        }

        await this.usersService.verifyEmail(email, transactionManager);
        return { message: 'Email verified successfully. Please log in.' };
      } else if (type === VerificationCodeType.PASSWORD_RESET) {
        const resetToken = await this.jwtService.signAsync(
          { email },
          {
            expiresIn:
              this.configService.get('RESET_PASSWORD_TOKEN_EXPIRES_IN') ||
              '15m',
          },
        );
        return { resetToken };
      }
    });
  }
}
