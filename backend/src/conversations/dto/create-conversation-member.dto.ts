import { IsEnum, IsOptional, IsString } from "class-validator";
import { ConversationMemberRole } from "../entities/conversation-member.entity";

export class CreateConversationMemberDto {
  @IsString()
  conversation_id: string

  @IsString()
  user_id: string

  @IsEnum(ConversationMemberRole)
  role: ConversationMemberRole
}