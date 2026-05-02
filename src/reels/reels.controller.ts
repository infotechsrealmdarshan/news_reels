import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { ReelsService } from './reels.service';
import { ReelsScraperService } from './reels-scraper.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CreateReelDto } from './dto/create-reel.dto';
import { GetReelsDto } from './dto/get-reels.dto';

@ApiTags('reels')
@Controller('reels')
export class ReelsController {
  constructor(
    private readonly reelsService: ReelsService,
    private readonly reelsScraperService: ReelsScraperService,
  ) {}

  @Post('scrape')
  @ApiOperation({ summary: 'Manually trigger viral reels scraping' })
  @ApiResponse({ status: 200, description: 'Scraping triggered.' })
  async triggerScrape() {
    this.reelsScraperService.scrapeViralReels();
    return { error: false, msg: 'Reels scraping started in background' };
  }

  @Post()
  @ApiOperation({ summary: 'Add a new reel' })
  @ApiResponse({ status: 201, description: 'The reel has been successfully created.' })
  async create(@Body() createReelDto: CreateReelDto) {
    return this.reelsService.createReel(createReelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get reels with pagination' })
  @ApiResponse({ status: 200, description: 'Return paginated reels.' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by title or description' })
  async findAll(@Query() query: GetReelsDto) {
    return this.reelsService.getReels(query);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Increment like count for a reel' })
  @ApiParam({ name: 'id', description: 'Reel document ID' })
  @ApiResponse({ status: 200, description: 'Like count incremented.' })
  async like(@Param('id') id: string) {
    return this.reelsService.likeReel(id);
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Increment view count for a reel' })
  @ApiParam({ name: 'id', description: 'Reel document ID' })
  @ApiResponse({ status: 200, description: 'View count incremented.' })
  async view(@Param('id') id: string) {
    return this.reelsService.viewReel(id);
  }
}
