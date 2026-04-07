import { Expose, Type } from "class-transformer";
import { GroupPrivacy } from "../entities/group.entity";
import { PostResponseDto } from "@/posts/dto/post-response.dto";
import { UserResponseDto } from "@/users/dto/user-response.dto";

export class GroupResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  description!: string;

  @Expose()
  cover_url!: string;

  @Expose()
  privacy!: GroupPrivacy;

  @Expose()
  created_at!: Date;

  @Expose()
  @Type(() => UserResponseDto )
  creator!: UserResponseDto

  @Expose()
  @Type(() => PostResponseDto)
  posts!: PostResponseDto[];
}