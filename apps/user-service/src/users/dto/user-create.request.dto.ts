import { IsEmail, IsNotEmpty } from 'class-validator';

export class UserCreateRequestDto {
  @IsNotEmpty()
  name: string;
  @IsEmail()
  email: string;
}
