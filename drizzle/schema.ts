import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

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
