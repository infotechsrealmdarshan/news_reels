import { Controller, Post, Get, Body } from '@nestjs/common';
import { NewsService } from './news.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateNewsDto } from './dto/create-news.dto';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new news item' })
  @ApiResponse({ status: 201, description: 'The news item has been successfully created.' })
  async create(@Body() createNewsDto: CreateNewsDto) {
    return this.newsService.createNews(createNewsDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all news items sorted by latest-first' })
  @ApiResponse({ status: 200, description: 'Return all news items.' })
  async findAll() {
    return this.newsService.getNews();
  }
}
