/*
  Warnings:

  - You are about to drop the column `publisher_name` on the `publisher_onboarding` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "publisher_onboarding" DROP COLUMN "publisher_name",
ADD COLUMN     "publisher_first_name" TEXT,
ADD COLUMN     "publisher_last_name" TEXT;
