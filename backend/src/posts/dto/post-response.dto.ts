import { UserResponseDto } from '@/users/dto/user-response.dto';
import { Expose, Exclude, Type } from 'class-transformer';
import { CommentResponseDto } from '@/comments/dto/comment-response.dto';
import { PostMediaResponseDto } from '@/medias/entities/post-media-response.dto';

export class PostResponseDto {
  @Expose()
  id!: string;

  @Expose()
  group_id?: string;

  @Expose()
  author_id!: string;

  @Expose()
  content!: string;

  @Expose()
  privacy?: string;

  @Expose()
  react_count!: number;

  @Expose()
  comment_count!: number;

  @Expose()
  share_count!: number;

  @Exclude()
  original_post_id?: string;

  @Exclude()
  root_post_id?: string;

  @Expose()
  created_at!: Date;

  @Expose()
  @Type(() => UserResponseDto)
  author!: UserResponseDto;

  @Expose()
  @Type(() => CommentResponseDto)
  comments!: CommentResponseDto[];

  @Expose()
  @Type(() => PostMediaResponseDto)
  postMedias!: PostMediaResponseDto[];

  @Expose()
  @Type(() => PostResponseDto)
  original_post?: PostResponseDto;

  @Expose()
  @Type(() => PostResponseDto)
  root_post?: PostResponseDto;
}