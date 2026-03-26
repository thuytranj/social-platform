import { IsString } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  full_name?: string;

  @IsString()
  sex?: string;

  @IsString()
  date_of_birth?: string;

  @IsString()
  avatar_url?: string;

  @IsString()
  cover_url?: string;

  @IsString()
  bio?: string;
}