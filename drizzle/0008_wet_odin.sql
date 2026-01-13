CREATE TABLE `calendarEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`clientId` int,
	`projectId` int,
	`taskId` int,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`allDay` boolean NOT NULL DEFAULT false,
	`location` varchar(255),
	`type` enum('meeting','call','deadline','reminder','event','other') NOT NULL DEFAULT 'event',
	`color` varchar(7),
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendarEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`senderType` enum('admin','client') NOT NULL,
	`recipientId` int NOT NULL,
	`recipientType` enum('admin','client') NOT NULL,
	`clientId` int,
	`projectId` int,
	`subject` varchar(255),
	`content` text NOT NULL,
	`attachmentUrl` text,
	`attachmentName` varchar(255),
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
