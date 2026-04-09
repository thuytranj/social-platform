import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupMemberDto } from './create-group-member.dto';

export class UpdateGroupMemeberDto extends PartialType(CreateGroupMemberDto) { }