import { Module } from '@nestjs/common';
import { ReelsController } from './reels.controller';
import { ReelsScraperService } from './reels-scraper.service';
import { ReelsService } from './reels.service';
import { GoogleSheetModule } from '../google-sheet/google-sheet.module';

@Module({
  imports: [GoogleSheetModule],
  controllers: [ReelsController],
  providers: [ReelsService, ReelsScraperService],
  exports: [ReelsService],
})
export class ReelsModule {}