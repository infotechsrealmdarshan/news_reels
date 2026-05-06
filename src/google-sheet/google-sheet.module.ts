import { Global, Module } from '@nestjs/common';
import { GoogleSheetService } from './google-sheet.service';

@Global()
@Module({
  providers: [GoogleSheetService],
  exports: [GoogleSheetService],
})
export class GoogleSheetModule {}

