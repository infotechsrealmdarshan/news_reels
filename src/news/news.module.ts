import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsScraperService } from './news-scraper.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [NewsController],
  providers: [NewsService, NewsScraperService],
  exports: [NewsService],
})
export class NewsModule {}
