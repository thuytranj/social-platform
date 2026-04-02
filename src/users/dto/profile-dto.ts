import { IsEmail, IsEnum, IsString, IsStrongPassword } from 'class-validator';
import { Gender } from '../entities/profile.entity';

export class ProfileDto {
  // @IsEmail()
  // email?: string;

  // @IsString()
  // username?: string;

  // @IsStrongPassword({
  //   minLength: 8,
  //   minLowercase: 1,
  //   minUppercase: 1,
  //   minNumbers: 1,
  //   minSymbols: 1,
  // })
  // password?: string;

  // @IsString()
  // refresh_token?: string | null;

  @IsString()
  full_name?: string;

  @IsEnum(Gender)
  sex?: Gender;

  @IsString()
  date_of_birth?: string;

  @IsString()
  avatar_url?: string;

  @IsString()
  cover_url?: string;

  @IsString()
  bio?: string;
}
