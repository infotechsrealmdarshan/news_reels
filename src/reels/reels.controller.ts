import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ReelsService } from './reels.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateReelDto } from './dto/create-reel.dto';
import { GetReelsDto } from './dto/get-reels.dto';

@ApiTags('reels')
@Controller('reels')
export class ReelsController {
  constructor(private readonly reelsService: ReelsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new reel' })
  @ApiResponse({ status: 201, description: 'The reel has been successfully created.' })
  async create(@Body() createReelDto: CreateReelDto) {
    return this.reelsService.createReel(createReelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get reels with pagination' })
  @ApiResponse({ status: 200, description: 'Return paginated reels.' })
  async findAll(@Query() query: GetReelsDto) {
    return this.reelsService.getReels(query);
  }
}
