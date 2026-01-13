DROP TABLE `calendarEvents`;--> statement-breakpoint
DROP TABLE `clientInteractions`;--> statement-breakpoint
DROP TABLE `clients`;--> statement-breakpoint
DROP TABLE `companies`;--> statement-breakpoint
DROP TABLE `documentLines`;--> statement-breakpoint
DROP TABLE `documents`;--> statement-breakpoint
DROP TABLE `famillePrestations`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
DROP TABLE `notes`;--> statement-breakpoint
DROP TABLE `payments`;--> statement-breakpoint
DROP TABLE `prestations`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
DROP TABLE `secrets`;--> statement-breakpoint
DROP TABLE `taskActivities`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `clientId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `avatarUrl`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `defaultHourlyRate`;