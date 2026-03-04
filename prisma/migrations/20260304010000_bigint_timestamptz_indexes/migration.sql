-- AlterTable: providers - Timestamptz
ALTER TABLE "providers" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;
ALTER TABLE "providers" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable: products - Timestamptz
ALTER TABLE "products" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;
ALTER TABLE "products" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable: provider_products - Timestamptz
ALTER TABLE "provider_products" ALTER COLUMN "source_last_updated" SET DATA TYPE TIMESTAMPTZ;
ALTER TABLE "provider_products" ALTER COLUMN "fetched_at" SET DATA TYPE TIMESTAMPTZ;
ALTER TABLE "provider_products" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;
ALTER TABLE "provider_products" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable: provider_product_history - Timestamptz
ALTER TABLE "provider_product_history" ALTER COLUMN "changed_at" SET DATA TYPE TIMESTAMPTZ;

-- CreateIndex: composite index for findChanges query pattern
CREATE INDEX "provider_product_history_changed_at_change_type_idx" ON "provider_product_history"("changed_at" DESC, "change_type");
