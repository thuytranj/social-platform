import { IsString } from "class-validator";

export class VerificationCodeDto {
  @IsString()
  code: string;
}
