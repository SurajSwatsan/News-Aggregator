-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "currency" TEXT,
    "features" TEXT[],
    "credits" INTEGER NOT NULL DEFAULT 0,
    "validity_days" INTEGER NOT NULL DEFAULT 365,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "subscriptions" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);
