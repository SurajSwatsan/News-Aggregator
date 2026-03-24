/*
  Warnings:

  - You are about to drop the column `publisher_first_name` on the `publisher_onboarding` table. All the data in the column will be lost.
  - You are about to drop the column `publisher_last_name` on the `publisher_onboarding` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "publisher_onboarding" DROP COLUMN "publisher_first_name",
DROP COLUMN "publisher_last_name",
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT;
