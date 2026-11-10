import { IsEmail, IsString, Length, ValidateIf } from 'class-validator';
import { Trim } from 'libs/decorators';

export class PatchRequestDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Trim()
  @IsEmail()
  @Length(1, 120)
  email?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Trim()
  @IsString()
  @Length(1, 120)
  name?: string;
}
