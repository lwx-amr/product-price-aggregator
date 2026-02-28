-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('INITIAL', 'PRICE_CHANGE', 'AVAILABILITY_CHANGE', 'BOTH');

-- CreateTable
CREATE TABLE "providers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "canonical_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_products" (
    "id" SERIAL NOT NULL,
    "provider_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "external_id" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "availability" BOOLEAN NOT NULL DEFAULT true,
    "source_last_updated" TIMESTAMP(3),
    "fetched_at" TIMESTAMP(3) NOT NULL,
    "is_stale" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_product_history" (
    "id" SERIAL NOT NULL,
    "provider_product_id" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "old_price" DECIMAL(12,2),
    "currency" "Currency" NOT NULL,
    "availability" BOOLEAN NOT NULL,
    "old_availability" BOOLEAN,
    "change_type" "ChangeType" NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_product_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_name_key" ON "providers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_canonical_key_key" ON "products"("canonical_key");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE INDEX "provider_products_product_id_idx" ON "provider_products"("product_id");

-- CreateIndex
CREATE INDEX "provider_products_provider_id_idx" ON "provider_products"("provider_id");

-- CreateIndex
CREATE INDEX "provider_products_provider_id_availability_idx" ON "provider_products"("provider_id", "availability");

-- CreateIndex
CREATE INDEX "provider_products_provider_id_is_stale_idx" ON "provider_products"("provider_id", "is_stale");

-- CreateIndex
CREATE INDEX "provider_products_price_idx" ON "provider_products"("price");

-- CreateIndex
CREATE INDEX "provider_products_fetched_at_idx" ON "provider_products"("fetched_at");

-- CreateIndex
CREATE UNIQUE INDEX "provider_products_provider_id_external_id_key" ON "provider_products"("provider_id", "external_id");

-- CreateIndex
CREATE INDEX "provider_product_history_provider_product_id_changed_at_idx" ON "provider_product_history"("provider_product_id", "changed_at" DESC);

-- CreateIndex
CREATE INDEX "provider_product_history_change_type_idx" ON "provider_product_history"("change_type");

-- CreateIndex
CREATE INDEX "provider_product_history_changed_at_idx" ON "provider_product_history"("changed_at");

-- AddForeignKey
ALTER TABLE "provider_products" ADD CONSTRAINT "provider_products_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_products" ADD CONSTRAINT "provider_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_product_history" ADD CONSTRAINT "provider_product_history_provider_product_id_fkey" FOREIGN KEY ("provider_product_id") REFERENCES "provider_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
