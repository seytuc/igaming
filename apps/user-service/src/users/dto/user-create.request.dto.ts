import {
  IsEmail,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { Trim } from 'libs/decorators';

export class UserCreateRequestDto {
  @Trim()
  @IsString()
  @Length(1, 120)
  name: string;

  @Trim()
  @IsEmail()
  @MaxLength(64)
  email: string;
}
