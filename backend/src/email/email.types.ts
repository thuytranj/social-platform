export interface verifyEmailDto {
  otp: string;
  name?: string;
}

export interface resetPasswordDto {
  otp: string;
  newPassword: string;
}