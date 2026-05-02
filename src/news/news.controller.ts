import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateNewsDto, NewsCategory, NewsLanguage } from './dto/create-news.dto';
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
    summary: 'Get news items with optional category/language filter and pagination',
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
    name: 'language',
    required: false,
    enum: NewsLanguage,
    description: 'Filter by language (en, hi, gu).',
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
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by title or description',
  })
  async findAll(@Query() query: GetNewsDto & { language?: NewsLanguage }) {
    return this.newsService.getNews(query);
  }
}

