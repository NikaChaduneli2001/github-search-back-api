import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class SearchRepositoriesDto {
  @ApiProperty({
    description: 'Search query string for repositories',
    example: 'nestjs',
  })
  @IsString()
  query: string;

  @ApiPropertyOptional({
    description: 'Sort repositories by name in ascending or descending order',
    enum: SortOrder,
    example: SortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sort?: SortOrder;

  @ApiPropertyOptional({
    description: 'Ignore repositories where the name includes this string',
    example: 'test',
  })
  @IsOptional()
  @IsString()
  ignore?: string;
}
