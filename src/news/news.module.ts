import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsScraperService } from './news-scraper.service';
import { GoogleSheetModule } from '../google-sheet/google-sheet.module';

@Module({
  imports: [GoogleSheetModule],
  controllers: [NewsController],
  providers: [NewsService, NewsScraperService],
  exports: [NewsService],
})
export class NewsModule {}
