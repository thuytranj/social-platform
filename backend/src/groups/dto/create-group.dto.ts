import { IsEnum, IsString } from "class-validator";
import { IsOptional } from "class-validator";
import { GroupPrivacy } from "../entities/group.entity";

export class CreateGroupDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(GroupPrivacy)
  @IsOptional()
  privacy?: GroupPrivacy;
}