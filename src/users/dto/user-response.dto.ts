import { Expose, Exclude, Type } from 'class-transformer';
import { ProfileResponseDto } from './profile-response.dto';
export class UserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  username!: string;

  @Exclude()
  password!: string;

  @Expose()
  is_verified!: boolean;

  @Exclude()
  refresh_token!: string;

  @Expose()
  last_active_at!: Date;

  @Expose()
  created_at!: Date;

  @Expose()
  @Type(() => ProfileResponseDto)
  profile!: ProfileResponseDto;
}