import { IsEmail, IsString, IsStrongPassword, IsBoolean } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  username?: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password?: string;

  @IsBoolean()
  is_verified?: boolean;

  @IsString()
  refresh_token?: string | null;
}
