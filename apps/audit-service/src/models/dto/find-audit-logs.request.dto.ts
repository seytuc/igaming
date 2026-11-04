import { AuditLogAction } from '@app/contracts';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class FindAuditLogsRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  entity_type?: number;

  @IsOptional()
  @IsEnum(AuditLogAction)
  action?: AuditLogAction;

  @IsOptional()
  @IsISO8601()
  timestamp_from?: string;

  @IsOptional()
  @IsISO8601()
  timestamp_to?: string;
}
