import { IsString } from "class-validator";

export class CreateFriendshipDto {
  @IsString()
  addressee_id: string;

  @IsString()
  status: 'pending' | 'accepted' | 'rejected' | 'blocked' = 'pending';
}