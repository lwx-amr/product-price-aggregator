import { SwaggerApiPaginatedQuery } from '@core/decorators';
import { PageMetaDto } from '@core/dtos';
import { ResponseFactory } from '@core/factories';
import type { DataPageResponse, DataResponse } from '@core/interfaces';
import { dataResponseSchema, paginatedResponseSchema } from '@core/swagger';
import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ChangeResponseDto,
  GetChangesQueryDto,
  GetProductsQueryDto,
  ProductDetailResponseDto,
  ProductResponseDto,
} from './dto';
import { ProductsService } from './products.service';

@ApiExtraModels(PageMetaDto, ProductResponseDto, ProductDetailResponseDto, ChangeResponseDto)
@ApiTags('Products')
@ApiSecurity('api-key')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get aggregated products with current offers' })
  @SwaggerApiPaginatedQuery()
  @ApiOkResponse({
    description: 'Paginated list of canonical products and their matching offers.',
    schema: paginatedResponseSchema(ProductResponseDto),
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid API key.' })
  @ApiBadRequestResponse({ description: 'Invalid query parameters.' })
  async findAll(
    @Query() query: GetProductsQueryDto,
  ): Promise<DataPageResponse<ProductResponseDto>> {
    const { items, meta } = await this.productsService.findAll(query);

    return ResponseFactory.dataPage(
      items.map((product) => new ProductResponseDto(product)),
      meta,
    );
  }

  @Get('changes')
  @ApiOperation({ summary: 'Get recent price and availability changes' })
  @SwaggerApiPaginatedQuery()
  @ApiOkResponse({
    description: 'Paginated list of recent product changes.',
    schema: paginatedResponseSchema(ChangeResponseDto),
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid API key.' })
  @ApiBadRequestResponse({ description: 'Invalid timeframe or pagination parameters.' })
  async getChanges(
    @Query() query: GetChangesQueryDto,
  ): Promise<DataPageResponse<ChangeResponseDto>> {
    const { items, meta } = await this.productsService.findChanges(query);

    return ResponseFactory.dataPage(
      items.map((change) => new ChangeResponseDto(change)),
      meta,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product with current offers and recent history' })
  @ApiOkResponse({
    description: 'Detailed canonical product view with all provider offers.',
    schema: dataResponseSchema(ProductDetailResponseDto),
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid API key.' })
  @ApiBadRequestResponse({ description: 'Product id must be a valid number.' })
  @ApiNotFoundResponse({ description: 'Product was not found.' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DataResponse<ProductDetailResponseDto>> {
    const product = await this.productsService.findOne(id);

    return ResponseFactory.data(new ProductDetailResponseDto(product));
  }
}
