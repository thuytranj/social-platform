import { IsEnum, IsOptional, IsString } from "class-validator";
import { PostPrivacy } from "../entities/post.entity";
export class CreatePostDto {
  @IsOptional()
  @IsString()
  group_id?: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsEnum(PostPrivacy)
  privacy?: PostPrivacy;

  @IsOptional()
  @IsString()
  original_post_id?: string;

  @IsOptional()
  @IsString()
  root_post_id?: string;
}
