import { ChangeType, Prisma } from '.prisma/client';
import type { PageMeta } from '@core/interfaces';
import { PrismaService } from '@modules/database/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { GetChangesQueryDto, GetProductsQueryDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(query: GetProductsQueryDto) {
    const { productWhere, offerWhere } = this.buildWhereClause(query);

    const [total, products] = await Promise.all([
      this.prismaService.product.count({ where: productWhere }),
      this.prismaService.product.findMany({
        where: productWhere,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          canonicalKey: true,
          name: true,
          description: true,
          providerProducts: {
            where: Object.keys(offerWhere).length > 0 ? offerWhere : undefined,
            orderBy: [{ price: 'asc' }, { id: 'asc' }],
            select: {
              id: true,
              externalId: true,
              price: true,
              currency: true,
              availability: true,
              sourceLastUpdated: true,
              fetchedAt: true,
              isStale: true,
              provider: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      items: products,
      meta: this.buildPageMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: number) {
    const product = await this.prismaService.product.findUnique({
      where: { id },
      select: {
        id: true,
        canonicalKey: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        providerProducts: {
          orderBy: [{ providerId: 'asc' }, { price: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            externalId: true,
            price: true,
            currency: true,
            availability: true,
            sourceLastUpdated: true,
            fetchedAt: true,
            isStale: true,
            provider: {
              select: {
                name: true,
              },
            },
            history: {
              take: 20,
              orderBy: { changedAt: 'desc' },
              select: {
                id: true,
                price: true,
                oldPrice: true,
                currency: true,
                availability: true,
                oldAvailability: true,
                changeType: true,
                changedAt: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} was not found`);
    }

    return product;
  }

  async findChanges(query: GetChangesQueryDto) {
    const sinceDate = query.since
      ? new Date(query.since)
      : new Date(Date.now() - query.minutes * 60_000);

    const where: Prisma.ProviderProductHistoryWhereInput = {
      changedAt: {
        gte: sinceDate,
      },
      changeType: {
        not: ChangeType.INITIAL,
      },
    };

    const [total, changes] = await Promise.all([
      this.prismaService.providerProductHistory.count({ where }),
      this.prismaService.providerProductHistory.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { changedAt: 'desc' },
        select: {
          id: true,
          price: true,
          oldPrice: true,
          currency: true,
          availability: true,
          oldAvailability: true,
          changeType: true,
          changedAt: true,
          providerProduct: {
            select: {
              externalId: true,
              provider: {
                select: {
                  name: true,
                },
              },
              product: {
                select: {
                  id: true,
                  name: true,
                  canonicalKey: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      items: changes,
      meta: this.buildPageMeta(query.page, query.limit, total),
    };
  }

  private buildWhereClause(query: GetProductsQueryDto): {
    productWhere: Prisma.ProductWhereInput;
    offerWhere: Prisma.ProviderProductWhereInput;
  } {
    const productWhere: Prisma.ProductWhereInput = {};
    const offerWhere = this.buildOfferWhereClause(query);

    if (query.name) {
      productWhere.name = {
        contains: query.name.trim(),
        mode: 'insensitive',
      };
    }

    if (Object.keys(offerWhere).length > 0) {
      productWhere.providerProducts = {
        some: offerWhere,
      };
    }

    return { productWhere, offerWhere };
  }

  private buildOfferWhereClause(query: GetProductsQueryDto): Prisma.ProviderProductWhereInput {
    const where: Prisma.ProviderProductWhereInput = {};

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilter: Prisma.DecimalFilter = {};

      if (query.minPrice !== undefined) {
        priceFilter.gte = new Prisma.Decimal(query.minPrice);
      }

      if (query.maxPrice !== undefined) {
        priceFilter.lte = new Prisma.Decimal(query.maxPrice);
      }

      where.price = priceFilter;
    }

    if (query.availability !== undefined) {
      where.availability = query.availability;
    }

    if (query.stale !== undefined) {
      where.isStale = query.stale;
    }

    if (query.provider) {
      where.provider = {
        is: {
          name: query.provider,
        },
      };
    }

    return where;
  }

  private buildPageMeta(page: number, limit: number, total: number): PageMeta {
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
    };
  }
}
