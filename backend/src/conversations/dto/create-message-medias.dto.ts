import { IsString } from "class-validator";

export class CreateMessageMediasDto {
  @IsString()
  message_id: string

  @IsString()
  media_id: string
}