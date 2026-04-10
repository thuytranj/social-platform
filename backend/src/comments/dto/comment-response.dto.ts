import { Expose, Exclude, Type } from "class-transformer";
import { UserResponseDto } from "@/users/dto/user-response.dto";

export class CommentResponseDto {
  @Expose()
  id!: string;

  @Exclude()
  post_id!: string;

  @Exclude()
  author_id!: string;

  @Exclude()
  parent_id?: string;

  @Expose()
  content!: string;

  @Expose()
  created_at!: Date;

  @Expose()
  @Type(() => UserResponseDto)
  author!: UserResponseDto;

  @Expose()
  react_count!: number;
  
  @Expose()
  replies_count!: number;

  @Expose()
  @Type(() => CommentResponseDto)
  replies!: CommentResponseDto[];
}