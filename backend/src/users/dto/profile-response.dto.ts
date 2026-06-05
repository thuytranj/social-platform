import { Expose, Type, Exclude } from "class-transformer";
import { UserResponseDto } from "./user-response.dto";

export class ProfileResponseDto {
  @Expose()
  id!: string;

  @Expose()
  full_name!: string;

  @Expose()
  sex!: string;

  @Expose()
  date_of_birth!: Date;

  @Expose()
  avatar_url!: string;

  @Expose()
  avatar_public_id!: string;

  @Expose()
  cover_url!: string;

  @Expose()
  cover_public_id!: string;

  @Expose()
  bio!: string;

  @Exclude()
  @Type(() => UserResponseDto)
  user!: UserResponseDto;
}