import { IsEmail, IsEnum, IsOptional, IsString, IsStrongPassword } from 'class-validator';
import { Gender } from '../entities/profile.entity';

export class ProfileDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsEnum(Gender)
  @IsOptional()
  sex?: Gender;

  @IsString()
  @IsOptional()
  date_of_birth?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string | null = null;

  @IsString()
  @IsOptional()
  cover_url?: string | null = null;

  @IsString()
  @IsOptional()
  bio?: string;
}
