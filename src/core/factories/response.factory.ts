import type { DataArrayResponse, DataPageResponse, DataResponse, PageMeta } from '@core/interfaces';

export class ResponseFactory {
  static data<T>(item: T): DataResponse<T> {
    return { data: item };
  }

  static dataArray<T>(items: T[]): DataArrayResponse<T> {
    return { data: items };
  }

  static dataPage<T>(items: T[], meta: PageMeta): DataPageResponse<T> {
    return { data: items, meta };
  }
}
