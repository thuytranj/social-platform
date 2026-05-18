import { Exclude, Expose, Type } from "class-transformer";
import { ConversationMemberRole } from "../entities/conversation-member.entity";
import { UserResponseDto } from "@/users/dto/user-response.dto";
import { MessageResponseDto } from "./message-response.dto";

@Exclude()
export class ConversationMemberResponseDto {
  @Expose()
  id: string

  @Expose()
  conversation_id: string;

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto

  @Expose()
  role: ConversationMemberRole

  @Expose()
  unread_count: number;

  @Expose()
  @Type(() => Date)
  last_read_at?: Date

  @Expose()
  @Type(() => MessageResponseDto)
  last_read_message?: MessageResponseDto;

  @Expose()
  @Type(() => Date)
  joined_at: Date
}