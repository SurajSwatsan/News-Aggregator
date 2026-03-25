-- CreateTable
CREATE TABLE "advertisements" (
    "ad_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ad_type" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "placement_type" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("ad_uuid")
);
