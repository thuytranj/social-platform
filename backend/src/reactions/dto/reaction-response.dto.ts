import { Expose, Type } from "class-transformer";
import { ReactionType } from "../entities/reaction.entity";
import { UserResponseDto } from "@/users/dto/user-response.dto";

export class ReactionResponseDto {
  @Expose()
  id!: string;

  @Expose()
  type!: ReactionType;

  @Expose()
  @Type(() => UserResponseDto)
  author!: UserResponseDto;

  @Expose()
  created_at!: Date;
}