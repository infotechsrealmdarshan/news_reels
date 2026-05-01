import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';

export enum NewsCategory {
  ALL = 'all',
  TRENDING = 'trending',
  RELATIONSHIPS = 'relationships',
  WELLNESS = 'wellness',
  LIFESTYLE = 'lifestyle',
  CULTURE = 'culture',
}


export enum NewsLanguage {
  ENGLISH = 'en',
  HINDI = 'hi',
  GUJARATI = 'gu',
}

export class CreateNewsDto {
  @ApiProperty({
    description: 'The link to the news image',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  imageLink: string;

  @ApiProperty({
    description: 'Array of links to news images',
    type: [String],
    required: false,
  })
  @IsOptional()
  imageLinks?: string[];

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

  @ApiProperty({
    description: 'The language of the news',
    enum: NewsLanguage,
    example: NewsLanguage.ENGLISH,
    required: false,
  })
  @IsEnum(NewsLanguage)
  @IsOptional()
  language?: NewsLanguage;

  @ApiProperty({
    description: 'The source name of the news',
    example: 'BBC News',
    required: false,
  })
  @IsString()
  @IsOptional()
  sourceName?: string;

  @ApiProperty({
    description: 'The source URL of the news',
    example: 'https://bbc.com/news/123',
    required: false,
  })
  @IsString()
  @IsOptional()
  sourceUrl?: string;

  @ApiProperty({
    description: 'The publication date of the news',
    example: '2024-05-01T12:00:00Z',
    required: false,
  })
  @IsOptional()
  publishedAt?: Date;
}

