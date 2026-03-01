import { Injectable } from '@nestjs/common';

@Injectable()
export class ProvidersService {
  slugify(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  safeParseDate(value: unknown): Date | null {
    if (value === null || value === undefined) {
      return null;
    }

    const date = new Date(value as string | number | Date);

    return Number.isNaN(date.getTime()) ? null : date;
  }
}
