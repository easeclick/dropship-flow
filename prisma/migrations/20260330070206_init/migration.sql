-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source_id" TEXT,
    "shopify_id" TEXT,
    "source" TEXT NOT NULL DEFAULT 'aliexpress',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "cost_price" REAL NOT NULL,
    "sell_price" REAL NOT NULL,
    "profit" REAL NOT NULL,
    "weight" REAL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "ads_created" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "ad_id" TEXT,
    "ad_set_id" TEXT,
    "campaign_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "budget" REAL NOT NULL DEFAULT 10,
    "spend" REAL NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "roas" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Ad_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopify_order_id" TEXT,
    "product_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "customer_email" TEXT,
    "shipping_address" TEXT,
    "amount" REAL NOT NULL,
    "cost" REAL NOT NULL,
    "profit" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tracking_number" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Order_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");
