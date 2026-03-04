import type { ProductChangePayload } from './product-change.payload';

export enum AggregationEvent {
  PRODUCT_CHANGE = 'aggregation.product.change',
}

export interface AggregationEventPayloadMap {
  [AggregationEvent.PRODUCT_CHANGE]: ProductChangePayload;
}

export type AggregationEventPayload<TEvent extends AggregationEvent> =
  AggregationEventPayloadMap[TEvent];
