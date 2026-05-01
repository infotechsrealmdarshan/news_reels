import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateNewsDto, NewsCategory } from './dto/create-news.dto';
import { GetNewsDto } from './dto/get-news.dto';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new news item' })
  @ApiResponse({
    status: 201,
    description: 'The news item has been successfully created.',
  })
  async create(@Body() createNewsDto: CreateNewsDto) {
    return this.newsService.createNews(createNewsDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get news items with optional category filter and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated news items with pagination metadata.',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: NewsCategory,
    description: 'Filter by category. Omit or use "all" for all news.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  async findAll(@Query() query: GetNewsDto) {
    return this.newsService.getNews(query);
  }
}
