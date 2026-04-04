import { IsEnum, IsString } from "class-validator";
import { SocialProvider } from "../entities/social-accounts.entity";

export class SocialAccountDto {
  @IsString()
  user_id?: string;

  @IsEnum(SocialProvider)
  provider!: SocialProvider;

  @IsString()
  provider_user_id!: string;
}