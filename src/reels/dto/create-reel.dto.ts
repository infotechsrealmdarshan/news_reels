import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateReelDto {
  @ApiProperty({ example: 'dQw4w9WgXcQ' })
  @IsString()
  @IsNotEmpty()
  videoId: string;

  @ApiProperty({ example: 'https://www.youtube.com/shorts/dQw4w9WgXcQ' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  reelUrl: string;

  @ApiProperty({ example: 'fitness', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'hindi', required: false })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ example: 'Amazing viral video' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Check out this amazing video from Reddit' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'https://preview.redd.it/xyz.jpg', required: false })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({ example: 'https://www.redditstatic.com/avatar.png', required: false })
  @IsString()
  @IsOptional()
  profileImage?: string;
}
