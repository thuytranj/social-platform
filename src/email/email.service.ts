import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private readonly mailService: MailerService) {}

  async sendEmail(to: string, subject: string, template: string, context: any) {
    await this.mailService.sendMail({
      to,
      subject,
      template,
      context,
    });
  }

  async sendVerificationEmail(to: string, otp: string) {
    return this.sendEmail(to, 'Verify Your Email', 'verify-email', { otp });
  }

  async sendResetPasswordEmail(to: string, otp: string) {
    return this.sendEmail(to, 'Reset Your Password', 'reset-password.hbs', {
      otp,
    });
  }
}
