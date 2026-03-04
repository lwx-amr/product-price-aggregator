import { AggregationEvent, type AggregationEventPayload } from '@modules/aggregation/events';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class StreamsService {
  constructor(
    @InjectPinoLogger(StreamsService.name)
    private readonly logger: PinoLogger,
  ) {}

  private readonly productChangesSubject = new Subject<
    AggregationEventPayload<AggregationEvent.PRODUCT_CHANGE>
  >();

  getProductChangesStream(): Observable<AggregationEventPayload<AggregationEvent.PRODUCT_CHANGE>> {
    return this.productChangesSubject.asObservable();
  }

  @OnEvent(AggregationEvent.PRODUCT_CHANGE)
  handleProductChange(payload: AggregationEventPayload<AggregationEvent.PRODUCT_CHANGE>): void {
    this.logger.debug(
      {
        eventName: AggregationEvent.PRODUCT_CHANGE,
        productId: payload.productId,
        providerName: payload.providerName,
        changeType: payload.changeType,
      },
      'Broadcasting stream event',
    );
    this.productChangesSubject.next(payload);
  }
}
