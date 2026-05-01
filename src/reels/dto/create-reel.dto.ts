import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateReelDto {
  @ApiProperty({
    description: 'The URL of the reel video',
    example: 'https://example.com/reel.mp4',
  })
  @IsString()
  @IsNotEmpty()
  reelUrl: string;

  @ApiProperty({
    description: 'The title of the reel',
    example: 'Amazing Reel',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The description of the reel',
    example: 'Check out this cool content!',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
