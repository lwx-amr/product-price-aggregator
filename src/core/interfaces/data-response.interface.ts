import type { PageMeta } from './page-meta.interface';

export interface DataResponse<T> {
  data: T;
}

export interface DataArrayResponse<T> {
  data: T[];
}

export interface DataPageResponse<T> {
  data: T[];
  meta: PageMeta;
}
