import { PaginationQueryDto } from '@core/dtos';
import { ProviderName } from '@core/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class GetProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by product name',
    example: 'nestjs',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  declare name?: string;

  @ApiPropertyOptional({
    description: 'Minimum offer price',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  declare minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum offer price',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  declare maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Filter by offer availability',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  declare availability?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by provider',
    enum: ProviderName,
    example: ProviderName.PROVIDER_A,
  })
  @IsOptional()
  @IsEnum(ProviderName)
  declare provider?: ProviderName;

  @ApiPropertyOptional({
    description: 'Filter by stale offers',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  declare stale?: boolean;
}
