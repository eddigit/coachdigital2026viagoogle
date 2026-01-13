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
CREATE TABLE `clientInteractions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`type` enum('call','email','meeting','note','task','document','payment','other') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`date` timestamp NOT NULL DEFAULT (now()),
	`durationMinutes` int,
	`outcome` text,
	`nextSteps` text,
	`relatedId` int,
	`relatedType` varchar(50),
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientInteractions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`company` varchar(255),
	`address` text,
	`postalCode` varchar(10),
	`city` varchar(100),
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`avatarUrl` text,
	`userId` int,
	`notes` text,
	`tags` json DEFAULT ('[]'),
	`category` enum('prospect','active','inactive','vip') NOT NULL DEFAULT 'prospect',
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`siret` varchar(14),
	`tvaNumber` varchar(20),
	`defaultHourlyRate` decimal(10,2),
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`legalForm` enum('EI','EIRL','EURL','SARL','SAS','SASU','SA','SNC','SCI','Auto-entrepreneur'),
	`address` text,
	`postalCode` varchar(10),
	`city` varchar(100),
	`siret` varchar(14) NOT NULL,
	`tvaNumber` varchar(20),
	`tvaApplicable` boolean NOT NULL DEFAULT true,
	`capital` decimal(12,2),
	`rcs` varchar(50),
	`apeCode` varchar(10),
	`phone` varchar(20),
	`email` varchar(320),
	`website` varchar(255),
	`logoUrl` text,
	`bankName` varchar(100),
	`bankIban` varchar(34),
	`bankBic` varchar(11),
	`defaultPaymentTerms` int NOT NULL DEFAULT 30,
	`defaultInvoiceFooter` text,
	`defaultQuoteFooter` text,
	`invoicePrefix` varchar(10) NOT NULL DEFAULT 'FAC',
	`quotePrefix` varchar(10) NOT NULL DEFAULT 'DEV',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentLines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`order` int NOT NULL,
	`type` enum('product','service','section','comment') NOT NULL DEFAULT 'service',
	`prestationId` int,
	`description` text NOT NULL,
	`quantity` decimal(10,2) NOT NULL DEFAULT '1',
	`unit` enum('unit','hour','day','month','forfait','word','page') NOT NULL DEFAULT 'unit',
	`unitPriceHt` decimal(12,2) NOT NULL DEFAULT '0',
	`tvaRate` decimal(5,2) NOT NULL DEFAULT '20',
	`discountPercent` decimal(5,2) DEFAULT '0',
	`totalHt` decimal(12,2) NOT NULL DEFAULT '0',
	`totalTva` decimal(12,2) NOT NULL DEFAULT '0',
	`totalTtc` decimal(12,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documentLines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('quote','invoice','credit_note','proforma') NOT NULL,
	`number` varchar(50) NOT NULL,
	`companyId` int NOT NULL,
	`clientId` int NOT NULL,
	`projectId` int,
	`status` enum('draft','sent','viewed','accepted','rejected','paid','partial','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`date` timestamp NOT NULL DEFAULT (now()),
	`dueDate` timestamp,
	`validityDate` timestamp,
	`subject` varchar(255),
	`introduction` text,
	`conclusion` text,
	`totalHt` decimal(12,2) NOT NULL DEFAULT '0',
	`totalTva` decimal(12,2) NOT NULL DEFAULT '0',
	`totalTtc` decimal(12,2) NOT NULL DEFAULT '0',
	`discountAmount` decimal(12,2) DEFAULT '0',
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`paymentTerms` int DEFAULT 30,
	`paymentMethod` enum('bank_transfer','check','card','cash','other'),
	`isAcompteRequired` boolean NOT NULL DEFAULT false,
	`acomptePercentage` decimal(5,2),
	`acompteAmount` decimal(12,2),
	`pdfUrl` text,
	`sentAt` timestamp,
	`viewedAt` timestamp,
	`acceptedAt` timestamp,
	`notes` text,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `documents_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `famillePrestations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`color` varchar(7) DEFAULT '#3b82f6',
	`order` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `famillePrestations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromUserId` int NOT NULL,
	`toUserId` int NOT NULL,
	`clientId` int,
	`projectId` int,
	`subject` varchar(255),
	`content` text NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255),
	`content` text,
	`clientId` int,
	`projectId` int,
	`taskId` int,
	`category` enum('general','meeting','call','email','idea','technical','other') NOT NULL DEFAULT 'general',
	`tags` json DEFAULT ('[]'),
	`isPinned` boolean NOT NULL DEFAULT false,
	`color` varchar(7),
	`attachments` json DEFAULT ('[]'),
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`clientId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`paymentDate` timestamp NOT NULL DEFAULT (now()),
	`paymentMethod` enum('bank_transfer','check','card','cash','other') NOT NULL,
	`transactionReference` varchar(100),
	`notes` text,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prestations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`familleId` int,
	`unitPriceHt` decimal(12,2) NOT NULL,
	`unit` enum('unit','hour','day','month','forfait','word','page','package') NOT NULL DEFAULT 'hour',
	`defaultTvaRate` decimal(5,2) NOT NULL DEFAULT '20',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prestations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`clientId` int NOT NULL,
	`status` enum('draft','active','on_hold','completed','cancelled') NOT NULL DEFAULT 'draft',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`startDate` timestamp,
	`endDate` timestamp,
	`deadline` timestamp,
	`budget` decimal(12,2),
	`hourlyRate` decimal(10,2),
	`estimatedHours` decimal(10,2),
	`color` varchar(7),
	`tags` json DEFAULT ('[]'),
	`repositoryUrl` text,
	`stagingUrl` text,
	`productionUrl` text,
	`notes` text,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `secrets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`clientId` int,
	`projectId` int,
	`category` enum('hosting','database','api','social','email','ftp','ssh','other','security','server','crm') NOT NULL DEFAULT 'other',
	`url` text,
	`login` varchar(255),
	`password` text,
	`notes` text,
	`isSharedWithClient` boolean NOT NULL DEFAULT false,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `secrets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int,
	`clientId` int,
	`projectId` int,
	`description` text,
	`date` timestamp NOT NULL DEFAULT (now()),
	`durationMinutes` int NOT NULL,
	`hourlyRate` decimal(10,2),
	`isBillable` boolean NOT NULL DEFAULT true,
	`isInvoiced` boolean NOT NULL DEFAULT false,
	`invoicedDocumentId` int,
	`notes` text,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taskActivities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`clientId` int,
	`projectId` int,
	`status` enum('todo','in_progress','review','done','cancelled') NOT NULL DEFAULT 'todo',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`type` enum('task','bug','feature','meeting','call','email','other') NOT NULL DEFAULT 'task',
	`productionDate` timestamp,
	`timeSlot` enum('morning','afternoon','evening'),
	`startTime` varchar(5),
	`endTime` varchar(5),
	`estimatedHours` decimal(10,2),
	`actualHours` decimal(10,2),
	`progress` int DEFAULT 0,
	`hourlyRate` decimal(10,2),
	`isBillable` boolean NOT NULL DEFAULT true,
	`isInvoiced` boolean NOT NULL DEFAULT false,
	`invoicedDocumentId` int,
	`tags` json DEFAULT ('[]'),
	`checklist` json DEFAULT ('[]'),
	`attachments` json DEFAULT ('[]'),
	`notes` text,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','client') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `clientId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `defaultHourlyRate` decimal(10,2);