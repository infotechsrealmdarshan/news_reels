import { Module } from '@nestjs/common';
import { ReelsController } from './reels.controller';
import { ReelsService } from './reels.service';
import { ReelsScraperService } from './reels-scraper.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [ReelsController],
  providers: [ReelsService, ReelsScraperService],
  exports: [ReelsService],
})
export class ReelsModule {}
