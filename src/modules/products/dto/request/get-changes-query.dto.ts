import { PaginationQueryDto } from '@core/dtos';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class GetChangesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Return changes since this ISO timestamp',
    example: '2026-03-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  declare since?: string;

  @ApiPropertyOptional({
    description: 'Return changes from the last N minutes when since is not provided',
    example: 60,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minutes = 60;
}
