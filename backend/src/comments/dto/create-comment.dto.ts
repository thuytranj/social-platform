import { IsString } from "class-validator";

export class CreateCommentDto {
  @IsString()
  post_id!: string;

  @IsString()
  parent_id?: string;

  @IsString()
  content!: string;
}
