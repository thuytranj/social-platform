import { IsEnum, IsString } from "class-validator";
import { ReactionTargetType, ReactionType } from "../entities/reaction.entity";
export class CreateReactionDto {
  @IsString()
  target_id!: string;

  @IsEnum(ReactionTargetType)
  target_type!: ReactionTargetType;

  @IsEnum(ReactionType)
  type!: ReactionType;
}