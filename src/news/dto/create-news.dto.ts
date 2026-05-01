import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export enum NewsCategory {
  ALL = 'all',
  TRENDING = 'trending',
  RELATIONSHIPS = 'relationships',
  WELLNESS = 'wellness',
  LIFESTYLE = 'lifestyle',
  CULTURE = 'culture',
}

export class CreateNewsDto {
  @ApiProperty({
    description: 'The link to the news image',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  imageLink: string;

  @ApiProperty({
    description: 'The title of the news',
    example: 'Breaking News',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'The description of the news',
    example: 'Detailed description of what happened...',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'The category of the news',
    enum: NewsCategory,
    example: NewsCategory.TRENDING,
    default: NewsCategory.ALL,
  })
  @IsEnum(NewsCategory)
  category: NewsCategory;
}
