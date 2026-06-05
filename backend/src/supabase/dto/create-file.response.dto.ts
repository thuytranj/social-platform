import { IsOptional, IsString, IsNumber } from "class-validator";

export class CreateFileDto {
  @IsString()
  @IsOptional()
  message_id?: string

  @IsString()
  @IsOptional()
  post_id?: string

  @IsString()
  @IsOptional()
  comment_id?: string

  @IsString()
  url: string

  @IsString()
  file_name: string

  @IsString()
  original_name: string

  @IsNumber()
  file_size: number

  @IsString()
  mime_type: string
}