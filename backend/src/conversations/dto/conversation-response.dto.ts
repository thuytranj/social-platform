import { ConversationType } from "../entities/conversation.entity";
import { Exclude, Expose, Type } from "class-transformer";
import { MessageResponseDto } from "./message-response.dto";

@Exclude()
export class ConversationResponseDto {
  @Expose()
  id: string

  @Expose()
  title: string

  @Expose()
  type: ConversationType

  @Expose()
  thumbnail_url: string

  @Expose()
  unread_count: number

  @Expose()
  @Type(() => MessageResponseDto)
  last_message: MessageResponseDto

  @Expose()
  last_message_time: string
}
