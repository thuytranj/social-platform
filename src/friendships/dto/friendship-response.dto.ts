import { Exclude, Expose, Type } from "class-transformer";
import { UserResponseDto } from "@/users/dto/user-response.dto";

export class FriendshipResponseDto {
  @Expose()
  id!: string;

  @Expose()
  requester_id!: string;

  @Expose()
  addressee_id!: string;

  @Expose()
  status!: string;

  @Expose()
  created_at!: Date;

  @Exclude()
  user_low_id!: string;
  
  @Exclude()
  user_high_id!: string;

  @Expose()
  @Type(() => UserResponseDto)
  requester!: UserResponseDto;

  @Expose()
  @Type(() => UserResponseDto)
  addressee!: UserResponseDto;
}