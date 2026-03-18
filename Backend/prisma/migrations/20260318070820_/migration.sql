-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'publisher', 'reader');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('pending', 'registered', 'approved', 'rejected', 'completed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "name" TEXT,
    "org_name" TEXT,
    "org_website" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "country" TEXT,
    "business_doc" TEXT,
    "newspaper_license" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'reader',
    "credit_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "homepage_url" TEXT NOT NULL,
    "rss_url" TEXT,
    "scrape_config" JSONB,
    "payout_rate" DECIMAL(10,2) NOT NULL DEFAULT 0.1,
    "scraping_interval" INTEGER NOT NULL DEFAULT 60,
    "owner_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "synopsis" TEXT,
    "image_url" TEXT,
    "source_url" TEXT NOT NULL,
    "posted_at" TIMESTAMP(3) NOT NULL,
    "category" TEXT,
    "cluster_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publisher_onboarding" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password_hash" TEXT,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'pending',
    "org_name" TEXT,
    "org_website" TEXT,
    "rss_url" TEXT,
    "org_description" TEXT,
    "publisher_name" TEXT,
    "country" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "business_doc" TEXT,
    "newspaper_license" TEXT,
    "requested_role" "UserRole" NOT NULL DEFAULT 'reader',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publisher_onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "articles_source_url_key" ON "articles"("source_url");

-- CreateIndex
CREATE UNIQUE INDEX "publisher_onboarding_token_key" ON "publisher_onboarding"("token");

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
