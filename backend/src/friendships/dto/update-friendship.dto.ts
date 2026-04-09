import { PartialType } from '@nestjs/mapped-types';
import { CreateFriendshipDto } from './creat-friendship.dto';

export class UpdateFriendshipDto extends PartialType(CreateFriendshipDto) { }