import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date, json } from "drizzle-orm/mysql-core";

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
  phone: varchar("phone", { length: 20 }),
  avatarUrl: varchar("avatarUrl", { length: 500 }),
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
  // Avatar
  avatarUrl: varchar("avatarUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ============================================================================
// LEADS (Prospection)
// ============================================================================

export const leads = mysqlTable("leads", {
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
  // Pipeline de vente SPANCO (Suspect, Prospect, Analyse, Négociation, Conclusion, Ordre)
  status: mysqlEnum("status", ["suspect", "prospect", "analyse", "negociation", "conclusion", "ordre"]).default("suspect").notNull(),
  potentialAmount: decimal("potentialAmount", { precision: 10, scale: 2 }),
  probability: int("probability").default(25), // % de chance de conversion
  source: varchar("source", { length: 100 }), // LinkedIn, Référence, Site web, etc.
  // Notes et suivi
  notes: text("notes"),
  lastContactDate: date("lastContactDate"),
  nextFollowUpDate: date("nextFollowUpDate"),
  // Avatar
  avatarUrl: varchar("avatarUrl", { length: 500 }),
  // Score d'engagement (0-100)
  score: int("score").default(0).notNull(),
  // Audience / Segment
  audience: varchar("audience", { length: 100 }).default("general"),
  // Activation vers le portefeuille d'affaires
  isActivated: boolean("isActivated").default(false).notNull(),
  activatedAt: timestamp("activatedAt"),
  // Conversion
  convertedToClientId: int("convertedToClientId"),
  convertedAt: timestamp("convertedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ============================================================================
// EMAIL TEMPLATES (Templates de prospection)
// ============================================================================

export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  // Structure JSON pour l'éditeur drag & drop (blocs: header, texte, image, bouton, footer)
  bodyJson: json("bodyJson"),
  category: mysqlEnum("category", ["voeux", "presentation", "relance", "rendez_vous", "suivi", "remerciement", "autre"]).notNull(),
  // Aperçu HTML généré depuis bodyJson
  previewHtml: text("previewHtml"),
  // Variables disponibles dans ce template
  variables: json("variables"),
  isActive: boolean("isActive").default(true).notNull(),
  // Statistiques d'utilisation
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

// ============================================================================
// LEAD EMAILS (Historique des envois)
// ============================================================================

export const leadEmails = mysqlTable("leadEmails", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  templateId: int("templateId"),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  sentBy: int("sentBy").notNull(),
  status: mysqlEnum("status", ["sent", "failed", "opened", "replied"]).default("sent").notNull(),
});

export type LeadEmail = typeof leadEmails.$inferSelect;
export type InsertLeadEmail = typeof leadEmails.$inferInsert;

// ============================================================================
// EMAIL CAMPAIGNS (Campagnes d'envoi de masse)
// ============================================================================

export const emailCampaigns = mysqlTable("emailCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  templateId: int("templateId"),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["draft", "sending", "completed", "paused"]).default("draft").notNull(),
  totalRecipients: int("totalRecipients").default(0).notNull(),
  sentCount: int("sentCount").default(0).notNull(),
  failedCount: int("failedCount").default(0).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

// ============================================================================
// EMAIL QUEUE (File d'attente des envois)
// ============================================================================

export const emailQueue = mysqlTable("emailQueue", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  leadId: int("leadId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["pending", "sending", "sent", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  scheduledAt: timestamp("scheduledAt").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailQueueItem = typeof emailQueue.$inferSelect;
export type InsertEmailQueueItem = typeof emailQueue.$inferInsert;

// ============================================================================
// EMAIL TRACKING (Tracking d'ouverture et de clics)
// ============================================================================

export const emailTracking = mysqlTable("emailTracking", {
  id: int("id").autoincrement().primaryKey(),
  emailQueueId: int("emailQueueId").notNull(),
  leadId: int("leadId").notNull(),
  trackingId: varchar("trackingId", { length: 255 }).notNull().unique(),
  opened: boolean("opened").default(false).notNull(),
  openedAt: timestamp("openedAt"),
  openCount: int("openCount").default(0).notNull(),
  clicked: boolean("clicked").default(false).notNull(),
  clickedAt: timestamp("clickedAt"),
  clickCount: int("clickCount").default(0).notNull(),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailTracking = typeof emailTracking.$inferSelect;
export type InsertEmailTracking = typeof emailTracking.$inferInsert;

// ============================================================================
// EMAIL BLACKLIST (Désabonnement)
// ============================================================================

export const emailBlacklist = mysqlTable("emailBlacklist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  reason: text("reason"),
  unsubscribedAt: timestamp("unsubscribedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailBlacklist = typeof emailBlacklist.$inferSelect;
export type InsertEmailBlacklist = typeof emailBlacklist.$inferInsert;

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
  // Logo
  logoUrl: varchar("logoUrl", { length: 500 }),
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
// NOTES
// ============================================================================

export const notes = mysqlTable("notes", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  clientId: int("clientId"),
  projectId: int("projectId"),
  taskId: int("taskId"),
  color: mysqlEnum("color", ["yellow", "blue", "green", "red", "purple", "orange"]).default("yellow"),
  pinned: boolean("pinned").default(false).notNull(),
  isClientVisible: boolean("isClientVisible").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

// ============================================================================
// DOCUMENTS (Devis, Factures)
// ============================================================================

export const timeEntries = mysqlTable("timeEntries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskId: int("taskId"),
  projectId: int("projectId"),
  clientId: int("clientId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: date("date").notNull(),
  period: mysqlEnum("period", ["morning", "afternoon", "evening"]).notNull(),
  type: mysqlEnum("type", ["billable", "non_billable"]).notNull(),
  startTime: timestamp("startTime"),
  endTime: timestamp("endTime"),
  duration: int("duration"), // en minutes
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }),
  priority: int("priority").default(3), // 1 (haute) à 5 (basse)
  status: mysqlEnum("status", ["planned", "in_progress", "completed", "archived"]).default("planned"),
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

// Variables d'environnement des projets (credentials sécurisés)
export const projectVariables = mysqlTable("projectVariables", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  value: text("value").notNull(), // Stockage chiffré recommandé
  type: varchar("type", { length: 50 }).notNull(), // hosting, smtp, api, ftp, other
  description: text("description"),
  isSecret: boolean("isSecret").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// Notes des projets
export const projectNotes = mysqlTable("projectNotes", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  tags: varchar("tags", { length: 500 }), // Comma-separated tags
  isPinned: boolean("isPinned").default(false),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["deadline", "message", "invoice", "task"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 500 }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ==========================================================================
// DOCUMENT TEMPLATES
// ==========================================================================

export const documentTemplates = mysqlTable("documentTemplates", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(), // Propriétaire du template
  type: mysqlEnum("type", ["quote", "invoice"]).notNull(), // Type de document
  name: varchar("name", { length: 255 }).notNull(), // Nom du template
  logoUrl: text("logoUrl"), // URL du logo entreprise
  primaryColor: varchar("primaryColor", { length: 7 }).default("#E67E50"), // Couleur principale (hex)
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#1E293B"), // Couleur secondaire
  companyName: varchar("companyName", { length: 255 }),
  companyAddress: text("companyAddress"),
  companyPhone: varchar("companyPhone", { length: 50 }),
  companyEmail: varchar("companyEmail", { length: 255 }),
  companySiret: varchar("companySiret", { length: 50 }),
  companyTva: varchar("companyTva", { length: 50 }),
  legalMentions: text("legalMentions"), // Mentions légales
  termsAndConditions: text("termsAndConditions"), // Conditions générales
  footerText: text("footerText"), // Texte du pied de page
  isDefault: boolean("isDefault").default(false), // Template par défaut
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type InsertDocumentTemplate = typeof documentTemplates.$inferInsert;

// ==========================================================================
// REVIEWS (Avis et notations clients)
// ==========================================================================

export const reviews = mysqlTable("reviews", {
  id: int("id").primaryKey().autoincrement(),
  clientId: int("clientId").notNull(), // Client qui laisse l'avis
  projectId: int("projectId"), // Projet concerné (optionnel)
  rating: int("rating").notNull(), // Note de 1 à 5
  comment: text("comment"), // Commentaire optionnel
  isPublic: boolean("isPublic").default(true).notNull(), // Afficher publiquement
  response: text("response"), // Réponse du coach
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ============================================================================
// DOCUMENT TRACKING (Suivi ouverture documents)
// ============================================================================

export const documentTracking = mysqlTable("documentTracking", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  trackingToken: varchar("trackingToken", { length: 64 }).notNull().unique(),
  viewCount: int("viewCount").default(0).notNull(),
  firstViewedAt: timestamp("firstViewedAt"),
  lastViewedAt: timestamp("lastViewedAt"),
  viewerIp: varchar("viewerIp", { length: 45 }),
  viewerUserAgent: text("viewerUserAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentTracking = typeof documentTracking.$inferSelect;
export type InsertDocumentTracking = typeof documentTracking.$inferInsert;

// ============================================================================
// DOCUMENT VIEWS (Historique détaillé des vues)
// ============================================================================

export const documentViews = mysqlTable("documentViews", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  trackingId: int("trackingId").notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  duration: int("duration"),
});

export type DocumentView = typeof documentViews.$inferSelect;
export type InsertDocumentView = typeof documentViews.$inferInsert;

// ============================================================================
// DOCUMENT SIGNATURES (Signatures électroniques)
// ============================================================================

export const documentSignatures = mysqlTable("documentSignatures", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  signatureToken: varchar("signatureToken", { length: 64 }).notNull().unique(),
  signerName: varchar("signerName", { length: 255 }).notNull(),
  signerEmail: varchar("signerEmail", { length: 320 }).notNull(),
  signerRole: mysqlEnum("signerRole", ["client", "coach"]).default("client").notNull(),
  status: mysqlEnum("status", ["pending", "signed", "declined", "expired"]).default("pending").notNull(),
  signatureData: text("signatureData"),
  signedAt: timestamp("signedAt"),
  signedIp: varchar("signedIp", { length: 45 }),
  signedUserAgent: text("signedUserAgent"),
  declinedReason: text("declinedReason"),
  expiresAt: timestamp("expiresAt"),
  reminderSentAt: timestamp("reminderSentAt"),
  reminderCount: int("reminderCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DocumentSignature = typeof documentSignatures.$inferSelect;
export type InsertDocumentSignature = typeof documentSignatures.$inferInsert;


// ============================================================================
// PROJECT SECRETS (Variables d'environnement sécurisées)
// ============================================================================

export const projectSecrets = mysqlTable("projectSecrets", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  category: mysqlEnum("category", ["database", "hosting", "smtp", "api", "ftp", "other"]).default("other").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Nom de la variable (ex: DB_HOST)
  value: text("value").notNull(), // Valeur (chiffrée côté serveur)
  description: text("description"), // Description optionnelle
  isVisible: boolean("isVisible").default(false).notNull(), // Pour l'affichage temporaire
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectSecret = typeof projectSecrets.$inferSelect;
export type InsertProjectSecret = typeof projectSecrets.$inferInsert;


// ============================================================================
// AUDIENCES (Segmentation des leads)
// ============================================================================

export const audiences = mysqlTable("audiences", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // Ex: "Avocats Paris", "Chefs d'entreprise"
  description: text("description"), // Description de l'audience
  color: varchar("color", { length: 7 }).default("#6366F1").notNull(), // Couleur pour l'affichage
  icon: varchar("icon", { length: 50 }), // Icône optionnelle
  // Statistiques calculées
  leadsCount: int("leadsCount").default(0).notNull(),
  convertedCount: int("convertedCount").default(0).notNull(),
  totalPotential: decimal("totalPotential", { precision: 12, scale: 2 }).default("0"),
  // Métadonnées
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Audience = typeof audiences.$inferSelect;
export type InsertAudience = typeof audiences.$inferInsert;
