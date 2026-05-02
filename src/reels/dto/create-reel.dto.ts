import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateReelDto {
  @ApiProperty({ example: 'https://v.redd.it/xyz.mp4' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  reelUrl: string;

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
