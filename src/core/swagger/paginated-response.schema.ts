import { Type } from '@nestjs/common';
import { getSchemaPath } from '@nestjs/swagger';
import { PageMetaDto } from '@core/dtos';

export function paginatedResponseSchema(itemDto: Type) {
  return {
    type: 'object' as const,
    properties: {
      data: {
        type: 'array' as const,
        items: { $ref: getSchemaPath(itemDto) },
      },
      meta: { $ref: getSchemaPath(PageMetaDto) },
    },
  };
}

export function dataResponseSchema(itemDto: Type) {
  return {
    type: 'object' as const,
    properties: {
      data: { $ref: getSchemaPath(itemDto) },
    },
  };
}
