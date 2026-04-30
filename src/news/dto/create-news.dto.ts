import { ApiProperty } from '@nestjs/swagger';

export class CreateNewsDto {
  @ApiProperty({
    description: 'The link to the news image',
    example: 'https://example.com/image.jpg',
  })
  imageLink: string;

  @ApiProperty({
    description: 'The title of the news',
    example: 'Breaking News',
  })
  title: string;

  @ApiProperty({
    description: 'The description of the news',
    example: 'Detailed description of what happened...',
  })
  description: string;
}
