/*
  Warnings:

  - A unique constraint covering the columns `[joinCode]` on the table `Workspace` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Workspace` ADD COLUMN `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `joinCode` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Workspace_joinCode_key` ON `Workspace`(`joinCode`);
