import { IsString } from "class-validator";

export class ConfirmFriendshipDto {
  @IsString()
  requester_id: string;

  @IsString()
  status: 'accepted' | 'rejected' = 'accepted';
}