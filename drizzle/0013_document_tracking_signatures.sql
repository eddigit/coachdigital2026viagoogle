-- Migration: Add document tracking, views, and signatures tables
-- Run this on your MySQL database to fix the missing tables error

CREATE TABLE IF NOT EXISTS `documentTracking` (
  `id` int AUTO_INCREMENT NOT NULL,
  `documentId` int NOT NULL,
  `trackingToken` varchar(64) NOT NULL,
  `viewCount` int NOT NULL DEFAULT 0,
  `firstViewedAt` timestamp NULL,
  `lastViewedAt` timestamp NULL,
  `viewerIp` varchar(45) NULL,
  `viewerUserAgent` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `documentTracking_id` PRIMARY KEY(`id`),
  CONSTRAINT `documentTracking_trackingToken_unique` UNIQUE(`trackingToken`)
);

CREATE TABLE IF NOT EXISTS `documentViews` (
  `id` int AUTO_INCREMENT NOT NULL,
  `documentId` int NOT NULL,
  `trackingId` int NOT NULL,
  `viewedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ipAddress` varchar(45) NULL,
  `userAgent` text NULL,
  `duration` int NULL,
  CONSTRAINT `documentViews_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `documentSignatures` (
  `id` int AUTO_INCREMENT NOT NULL,
  `documentId` int NOT NULL,
  `signatureToken` varchar(64) NOT NULL,
  `signerName` varchar(255) NOT NULL,
  `signerEmail` varchar(320) NOT NULL,
  `signerRole` enum('client','coach') NOT NULL DEFAULT 'client',
  `status` enum('pending','signed','declined','expired') NOT NULL DEFAULT 'pending',
  `signatureData` text NULL,
  `signedAt` timestamp NULL,
  `signedIp` varchar(45) NULL,
  `signedUserAgent` text NULL,
  `declinedReason` text NULL,
  `expiresAt` timestamp NULL,
  `reminderSentAt` timestamp NULL,
  `reminderCount` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `documentSignatures_id` PRIMARY KEY(`id`),
  CONSTRAINT `documentSignatures_signatureToken_unique` UNIQUE(`signatureToken`)
);

-- Add indexes for better performance
CREATE INDEX `idx_documentTracking_documentId` ON `documentTracking`(`documentId`);
CREATE INDEX `idx_documentViews_documentId` ON `documentViews`(`documentId`);
CREATE INDEX `idx_documentViews_trackingId` ON `documentViews`(`trackingId`);
CREATE INDEX `idx_documentSignatures_documentId` ON `documentSignatures`(`documentId`);
CREATE INDEX `idx_documentSignatures_status` ON `documentSignatures`(`status`);
