import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { GoogleSheetModule } from './google-sheet/google-sheet.module';
import { NewsModule } from './news/news.module';
import { ReelsModule } from './reels/reels.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    GoogleSheetModule,
    NewsModule,
    ReelsModule,
  ],
})
export class AppModule {}

