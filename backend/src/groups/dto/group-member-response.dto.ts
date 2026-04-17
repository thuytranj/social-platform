import { Expose, Type } from "class-transformer";
import { GroupRole, GroupMemberStatus } from "../entities/group-member.entity";
import { UserResponseDto } from "@/users/dto/user-response.dto";

export class GroupMemberResponseDto {
  @Expose()
  id!: string;

  @Expose()
  role!: GroupRole;

  @Expose()
  status!: GroupMemberStatus;

  @Expose()
  @Type(() => UserResponseDto)
  user!: UserResponseDto;

  @Expose()
  joined_at!: Date;
}