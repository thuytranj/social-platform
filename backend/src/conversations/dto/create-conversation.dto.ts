import { ConversationType } from "../entities/conversation.entity";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateConversationDto {
  @IsEnum(ConversationType)
  type: ConversationType

  @IsOptional()
  @IsString()
  title?: string

  @IsArray()
  @IsString({each: true})
  @IsNotEmpty({each: true})
  member_ids: string[]

  @IsOptional()
  @IsString()
  private_key?: string
}
