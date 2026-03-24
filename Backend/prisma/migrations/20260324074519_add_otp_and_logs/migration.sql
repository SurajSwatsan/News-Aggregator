-- AlterTable
ALTER TABLE "publisher_onboarding" ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otp_expires_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otp_expires_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "access_logs_user_id_article_id_key" ON "access_logs"("user_id", "article_id");
