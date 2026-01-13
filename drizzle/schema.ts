import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date } from "drizzle-orm/mysql-core";

/**
 * COACH DIGITAL - Schéma de base de données
 * Architecture propre et optimisée pour la gestion de coaching
 */

// ============================================================================
// USERS & AUTH
// ============================================================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// CLIENT USERS (Authentification espace client séparée)
// ============================================================================

export const clientUsers = mysqlTable("clientUsers", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(), // Lié à la table clients
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastLogin: timestamp("lastLogin"),
  invitationToken: varchar("invitationToken", { length: 64 }),
  invitationSentAt: timestamp("invitationSentAt"),
  passwordResetToken: varchar("passwordResetToken", { length: 64 }),
  passwordResetExpires: timestamp("passwordResetExpires"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientUser = typeof clientUsers.$inferSelect;
export type InsertClientUser = typeof clientUsers.$inferInsert;

// ============================================================================
// CLIENT REQUESTS (Demandes clients avec onboarding)
// ============================================================================

export const clientRequests = mysqlTable("clientRequests", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  requestType: mysqlEnum("requestType", [
    "coaching",
    "website",
    "app",
    "ia_integration",
    "optimization",
    "other"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  deadline: date("deadline"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "in_review",
    "accepted",
    "in_progress",
    "completed",
    "rejected"
  ]).default("pending").notNull(),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientRequest = typeof clientRequests.$inferSelect;
export type InsertClientRequest = typeof clientRequests.$inferInsert;

// ============================================================================
// CLIENT SECRETS (Coffre-fort RGPD pour credentials)
// ============================================================================

export const clientSecrets = mysqlTable("clientSecrets", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "api_key",
    "login_password",
    "hosting",
    "domain",
    "other"
  ]).notNull(),
  description: text("description"),
  // Données encryptées
  encryptedData: text("encryptedData").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientSecret = typeof clientSecrets.$inferSelect;
export type InsertClientSecret = typeof clientSecrets.$inferInsert;

// ============================================================================
// COMPANY (Informations de l'entreprise de Gilles)
// ============================================================================

export const company = mysqlTable("company", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  legalName: varchar("legalName", { length: 255 }),
  siret: varchar("siret", { length: 14 }),
  tvaNumber: varchar("tvaNumber", { length: 20 }),
  address: text("address"),
  postalCode: varchar("postalCode", { length: 10 }),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }).default("France"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 255 }),
  logoUrl: text("logoUrl"),
  // Informations bancaires
  bankName: varchar("bankName", { length: 255 }),
  iban: varchar("iban", { length: 34 }),
  bic: varchar("bic", { length: 11 }),
  // Paramètres par défaut
  defaultTvaRate: decimal("defaultTvaRate", { precision: 5, scale: 2 }).default("20.00"),
  defaultPaymentTerms: int("defaultPaymentTerms").default(30), // jours
  // Mentions légales
  legalMentions: text("legalMentions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof company.$inferSelect;
export type InsertCompany = typeof company.$inferInsert;

// ============================================================================
// CLIENTS
// ============================================================================

export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  // Informations personnelles
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  // Informations professionnelles
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 100 }),
  // Adresse
  address: text("address"),
  postalCode: varchar("postalCode", { length: 10 }),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }).default("France"),
  // Catégories et statuts
  category: mysqlEnum("category", ["prospect", "active", "vip", "inactive"]).default("prospect").notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  // Notes
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ============================================================================
// PROJECTS
// ============================================================================

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["website", "app", "coaching", "ia_integration", "optimization", "other"]).notNull(),
  status: mysqlEnum("status", ["draft", "active", "on_hold", "completed", "cancelled"]).default("draft").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal"),
  // Dates
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  estimatedHours: decimal("estimatedHours", { precision: 10, scale: 2 }),
  // Budget
  budgetEstimate: decimal("budgetEstimate", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ============================================================================
// TASKS
// ============================================================================

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId"),
  clientId: int("clientId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["todo", "in_progress", "review", "done", "cancelled"]).default("todo").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal"),
  // Dates
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  // Temps estimé
  estimatedHours: decimal("estimatedHours", { precision: 10, scale: 2 }),
  // Facturation
  isBillable: boolean("isBillable").default(true),
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ============================================================================
// TIME TRACKING
// ============================================================================

export const timeEntries = mysqlTable("timeEntries", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId"),
  projectId: int("projectId"),
  clientId: int("clientId"),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"),
  duration: int("duration"), // en minutes
  isBillable: boolean("isBillable").default(true),
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;

// ============================================================================
// DOCUMENTS (Devis, Factures)
// ============================================================================

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  projectId: int("projectId"),
  type: mysqlEnum("type", ["quote", "invoice", "credit_note"]).notNull(),
  number: varchar("number", { length: 50 }).notNull().unique(),
  status: mysqlEnum("status", ["draft", "sent", "accepted", "rejected", "paid", "cancelled"]).default("draft").notNull(),
  // Dates
  date: timestamp("date").notNull(),
  dueDate: timestamp("dueDate"),
  validityDate: timestamp("validityDate"),
  // Contenu
  subject: varchar("subject", { length: 255 }),
  introduction: text("introduction"),
  conclusion: text("conclusion"),
  notes: text("notes"),
  // Montants
  totalHt: decimal("totalHt", { precision: 10, scale: 2 }).notNull(),
  totalTva: decimal("totalTva", { precision: 10, scale: 2 }).notNull(),
  totalTtc: decimal("totalTtc", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).default("0.00"),
  // Paiement
  paymentTerms: int("paymentTerms").default(30),
  paymentMethod: mysqlEnum("paymentMethod", ["bank_transfer", "check", "card", "cash", "other"]),
  isAcompteRequired: boolean("isAcompteRequired").default(false),
  acomptePercentage: decimal("acomptePercentage", { precision: 5, scale: 2 }),
  acompteAmount: decimal("acompteAmount", { precision: 10, scale: 2 }),
  // PDF
  pdfUrl: text("pdfUrl"),
  // Stripe
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ============================================================================
// DOCUMENT LINES
// ============================================================================

export const documentLines = mysqlTable("documentLines", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1.00"),
  unit: varchar("unit", { length: 50 }).default("unité"),
  unitPriceHt: decimal("unitPriceHt", { precision: 10, scale: 2 }).notNull(),
  tvaRate: decimal("tvaRate", { precision: 5, scale: 2 }).notNull(),
  totalHt: decimal("totalHt", { precision: 10, scale: 2 }).notNull(),
  totalTva: decimal("totalTva", { precision: 10, scale: 2 }).notNull(),
  totalTtc: decimal("totalTtc", { precision: 10, scale: 2 }).notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentLine = typeof documentLines.$inferSelect;
export type InsertDocumentLine = typeof documentLines.$inferInsert;

// ============================================================================
// PROJECT REQUIREMENTS (Cahier des charges)
// ============================================================================

export const projectRequirements = mysqlTable("projectRequirements", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  version: int("version").default(1).notNull(),
  // Contenu
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  objectives: text("objectives"),
  scope: text("scope"),
  constraints: text("constraints"),
  deliverables: text("deliverables"),
  timeline: text("timeline"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  // Statut
  status: mysqlEnum("status", ["draft", "review", "approved", "archived"]).default("draft").notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"),
  // Métadonnées
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectRequirement = typeof projectRequirements.$inferSelect;
export type InsertProjectRequirement = typeof projectRequirements.$inferInsert;

// ============================================================================
// PROJECT CREDENTIALS (Coffre-fort RGPD par projet)
// ============================================================================

export const projectCredentials = mysqlTable("projectCredentials", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  // Catégorie
  category: mysqlEnum("category", [
    "hosting", // Hébergement (FTP, SSH, cPanel)
    "api", // API keys et tokens
    "smtp", // Configuration email
    "domain", // Accès domaine et DNS
    "cms", // Logins admin CMS
    "database", // Accès base de données
    "other" // Autre
  ]).notNull(),
  // Informations
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  // Credentials chiffrés
  encryptedData: text("encryptedData").notNull(), // JSON chiffré AES-256
  // Métadonnées
  url: text("url"),
  expiresAt: timestamp("expiresAt"),
  notes: text("notes"),
  // Traçabilité RGPD
  sharedBy: int("sharedBy"), // ID du client qui a partagé
  sharedAt: timestamp("sharedAt"),
  lastAccessedBy: int("lastAccessedBy"),
  lastAccessedAt: timestamp("lastAccessedAt"),
  accessCount: int("accessCount").default(0),
  // Statut
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectCredential = typeof projectCredentials.$inferSelect;
export type InsertProjectCredential = typeof projectCredentials.$inferInsert;

// ============================================================================
// CREDENTIAL ACCESS LOGS (Logs d'accès pour conformité CNIL/ANSSI)
// ============================================================================

export const credentialAccessLogs = mysqlTable("credentialAccessLogs", {
  id: int("id").autoincrement().primaryKey(),
  credentialId: int("credentialId").notNull(),
  accessedBy: int("accessedBy").notNull(),
  accessType: mysqlEnum("accessType", ["view", "edit", "delete"]).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  accessedAt: timestamp("accessedAt").defaultNow().notNull(),
});

export type CredentialAccessLog = typeof credentialAccessLogs.$inferSelect;
export type InsertCredentialAccessLog = typeof credentialAccessLogs.$inferInsert;

// ============================================================================
// MESSAGES (Messagerie interne coach ↔ clients)
// ============================================================================

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  // Participants
  senderId: int("senderId").notNull(), // ID de l'utilisateur (admin ou clientUser)
  senderType: mysqlEnum("senderType", ["admin", "client"]).notNull(),
  recipientId: int("recipientId").notNull(),
  recipientType: mysqlEnum("recipientType", ["admin", "client"]).notNull(),
  // Contexte
  clientId: int("clientId"), // Client concerné (pour filtrage)
  projectId: int("projectId"), // Projet concerné (optionnel)
  // Contenu
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  attachmentUrl: text("attachmentUrl"), // URL fichier joint (S3)
  attachmentName: varchar("attachmentName", { length: 255 }),
  // Statut
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  // Métadonnées
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ============================================================================
// CALENDAR EVENTS (Événements calendrier)
// ============================================================================

export const calendarEvents = mysqlTable("calendarEvents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  // Relations
  clientId: int("clientId"),
  projectId: int("projectId"),
  taskId: int("taskId"),
  // Dates
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  allDay: boolean("allDay").default(false).notNull(),
  // Détails
  location: varchar("location", { length: 255 }),
  type: mysqlEnum("type", ["meeting", "call", "deadline", "reminder", "event", "other"]).default("event").notNull(),
  color: varchar("color", { length: 7 }), // Code couleur hex (#FF5733)
  // Créateur
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;
