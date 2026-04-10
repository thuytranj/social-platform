import { IsEnum, IsOptional, IsString } from "class-validator";
import { ReactionTargetType, ReactionType } from "../entities/reaction.entity";
export class CreateReactionDto {
  @IsString()
  @IsOptional()
  target_id?: string;

  @IsEnum(ReactionTargetType)
  @IsOptional()
  target_type?: ReactionTargetType;

  @IsEnum(ReactionType)
  type!: ReactionType;
}