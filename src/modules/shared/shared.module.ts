import { Module } from '@nestjs/common';
import { HttpClientFactory } from './services';

@Module({
  providers: [HttpClientFactory],
  exports: [HttpClientFactory],
})
export class SharedModule {}
