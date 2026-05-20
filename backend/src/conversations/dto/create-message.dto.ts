import { IsEnum, IsOptional, IsString } from "class-validator";
import { MessageType } from "../entities/message.entity";

export class CreateMessageDto {
  @IsString()
  conversation_id: string

  @IsString()
  @IsOptional()
  reply_message_id?: string

  @IsEnum(MessageType)
  message_type: MessageType

  @IsString()
  @IsOptional()
  content?: string
}