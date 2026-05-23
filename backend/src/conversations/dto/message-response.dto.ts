import { Exclude, Expose, Type } from "class-transformer";
import { MessageType } from "../entities/message.entity";
import { UserResponseDto } from "@/users/dto/user-response.dto";
import { MediaResponseDto } from "@/medias/entities/media-response.dto";
import { FileResponseDto } from "@/supabase/dto/file-response.dto";
import { ReactionResponseDto } from "@/reactions/dto/reaction-response.dto";

export class MessageResponseDto {
  @Expose()
  id: string;

  @Expose()
  conversation_id: string;

  @Expose()
  @Type(() => UserResponseDto)
  sender: UserResponseDto;

  @Expose()
  @Type(() => MessageResponseDto)
  reply_message?: MessageResponseDto;

  @Expose()
  message_type: MessageType;

  @Expose()
  content?: string;

  @Expose()
  react_count: number;

  @Expose()
  @Type(() => ReactionResponseDto)
  reactions?: ReactionResponseDto[];

  @Expose()
  @Type(() => MediaResponseDto)
  medias: MediaResponseDto[];

  @Expose()
  @Type(() => FileResponseDto)
  files: FileResponseDto[];

  @Expose()
  @Type(() => Date)
  sent_at: Date;

  @Exclude()
  @Type(() => Date)
  updated_at: Date;

  @Exclude()
  @Type(() => Date)
  deleted_at?: Date;
}