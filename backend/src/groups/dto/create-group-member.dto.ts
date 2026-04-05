import { IsString, IsEnum, IsOptional } from "class-validator";
import {GroupRole} from "../entities/group-member.entity";
import {GroupStatus} from "../entities/group-member.entity";

export class CreateGroupMemberDto {
  @IsString()
  group_id!: string;

  @IsEnum(GroupRole)
  @IsOptional()
  role?: GroupRole;

  @IsEnum(GroupStatus)
  @IsOptional()
  status?: GroupStatus;
}