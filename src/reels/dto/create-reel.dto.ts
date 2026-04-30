import { ApiProperty } from '@nestjs/swagger';

export class CreateReelDto {
  @ApiProperty({
    description: 'The URL of the reel video',
    example: 'https://example.com/reel.mp4',
  })
  reelUrl: string;

  @ApiProperty({
    description: 'The title of the reel',
    example: 'Amazing Reel',
  })
  title: string;

  @ApiProperty({
    description: 'The description of the reel',
    example: 'Check out this cool content!',
  })
  description: string;
}
