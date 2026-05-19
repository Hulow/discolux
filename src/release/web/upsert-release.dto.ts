import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpsertReleaseDto {
  @ApiProperty({ example: 1, description: 'Discogs release ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;

  @ApiPropertyOptional({ example: 'Sweden' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '1999-03-00' })
  @IsOptional()
  @IsString()
  released?: string;

  @ApiPropertyOptional({ example: ['Electronic'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @ApiPropertyOptional({ example: ['Deep House'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styles?: string[];
}
