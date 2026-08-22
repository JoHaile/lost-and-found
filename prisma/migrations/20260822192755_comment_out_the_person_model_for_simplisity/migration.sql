/*
  Warnings:

  - You are about to drop the column `reportedById` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the `Person` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_reportedById_fkey";

-- DropIndex
DROP INDEX "Item_reportedById_idx";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "reportedById";

-- DropTable
DROP TABLE "Person";

-- CreateIndex
CREATE INDEX "Item_id_idx" ON "Item"("id");
