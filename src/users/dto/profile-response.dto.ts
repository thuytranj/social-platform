import { Expose } from "class-transformer";

export class ProfileResponseDto {
  @Expose()
  id: string;

  @Expose()
  full_name: string;

  @Expose()
  sex: string;

  @Expose()
  date_of_birth: Date;

  @Expose()
  avatar_url: string;

  @Expose()
  cover_url: string;

  @Expose()
  bio: string;
}