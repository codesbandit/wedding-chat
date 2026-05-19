-- AlterTable
ALTER TABLE `guests` ADD COLUMN `last_visited_at` DATETIME(3) NULL,
    ADD COLUMN `visit_count` INTEGER NOT NULL DEFAULT 0;
