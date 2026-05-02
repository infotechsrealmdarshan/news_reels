import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { NewsService } from './news.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CreateNewsDto, NewsCategory, NewsLanguage } from './dto/create-news.dto';
import { GetNewsDto } from './dto/get-news.dto';

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
  @ApiOperation({ summary: 'Get news items with optional category/language filter and pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated news items with pagination metadata.' })
  @ApiQuery({ name: 'category', required: false, enum: NewsCategory, description: 'Filter by category. Omit or use "all" for all news.' })
  @ApiQuery({ name: 'language', required: false, enum: NewsLanguage, description: 'Filter by language (en, hi, gu).' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by title or description' })
  async findAll(@Query() query: GetNewsDto & { language?: NewsLanguage }) {
    return this.newsService.getNews(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single news item by ID' })
  @ApiParam({ name: 'id', description: 'News document ID' })
  @ApiResponse({ status: 200, description: 'Returns a single news item.' })
  async findOne(@Param('id') id: string) {
    return this.newsService.getNewsById(id);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Increment like count for a news item' })
  @ApiParam({ name: 'id', description: 'News document ID' })
  @ApiResponse({ status: 200, description: 'Like count incremented.' })
  async like(@Param('id') id: string) {
    return this.newsService.likeNews(id);
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Increment view count for a news item' })
  @ApiParam({ name: 'id', description: 'News document ID' })
  @ApiResponse({ status: 200, description: 'View count incremented.' })
  async view(@Param('id') id: string) {
    return this.newsService.viewNews(id);
  }
}
