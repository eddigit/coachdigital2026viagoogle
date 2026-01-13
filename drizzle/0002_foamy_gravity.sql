ALTER TABLE `clients` MODIFY COLUMN `tags` json;--> statement-breakpoint
ALTER TABLE `notes` MODIFY COLUMN `tags` json;--> statement-breakpoint
ALTER TABLE `notes` MODIFY COLUMN `attachments` json;--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `tags` json;--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `tags` json;--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `checklist` json;--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `attachments` json;