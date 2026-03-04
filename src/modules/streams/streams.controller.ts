import { Public } from '@core/decorators';
import { Controller, Get, Header, MessageEvent, Sse } from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { interval, map, merge, Observable } from 'rxjs';
import { StreamsService } from './streams.service';

@ApiTags('Streams')
@Public()
@Controller('streams')
export class StreamsController {
  constructor(
    private readonly streamEventsService: StreamsService,
    @InjectPinoLogger(StreamsController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Get('viewer')
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'text/html')
  async viewer(): Promise<string> {
    return readFile(join(process.cwd(), 'public', 'index.html'), 'utf-8');
  }

  @Sse('products')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Stream product price and availability changes in real time',
  })
  @ApiProduces('text/event-stream')
  @ApiOkResponse({
    description:
      'Server-Sent Events stream with product change notifications and heartbeat events.',
  })
  products(): Observable<MessageEvent> {
    this.logger.info({ stream: 'products' }, 'Opened SSE stream');

    const heartbeat$ = interval(30000).pipe(
      map(
        (): MessageEvent => ({
          type: 'heartbeat',
          data: {
            timestamp: new Date().toISOString(),
          },
        }),
      ),
    );

    const productChanges$ = this.streamEventsService.getProductChangesStream().pipe(
      map(
        (payload): MessageEvent => ({
          type: 'product-change',
          data: payload,
        }),
      ),
    );

    return merge(productChanges$, heartbeat$);
  }
}
