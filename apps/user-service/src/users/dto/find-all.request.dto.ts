import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit: number = 10;

  @IsIn(['name', 'email', 'created_at'])
  sort_by: 'name' | 'email' | 'created_at' = 'created_at';

  @IsIn(['asc', 'desc'])
  sort_dir: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  created_from?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  created_to?: string;
}
