import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  InsertUser,
  company,
  InsertCompany,
  clients,
  InsertClient,
  projects,
  InsertProject,
  tasks,
  InsertTask,
  timeEntries,
  InsertTimeEntry,
  documents,
  InsertDocument,
  documentLines,
  InsertDocumentLine,
  projectCredentials,
  credentialAccessLogs,
  projectRequirements,
  reviews,
  InsertReview,
  clientRequests,
  InsertClientRequest,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USERS
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// COMPANY
// ============================================================================

export async function getCompany() {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(company).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertCompany(data: InsertCompany) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getCompany();
  
  if (existing) {
    await db.update(company).set(data).where(eq(company.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(company).values(data);
    return Number(result[0].insertId);
  }
}

// ============================================================================
// CLIENTS
// ============================================================================

export async function getAllClients() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clients).values(data);
  return Number(result[0].insertId);
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(clients).where(eq(clients.id, id));
}

export async function searchClients(query: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(clients)
    .where(
      or(
        like(clients.firstName, `%${query}%`),
        like(clients.lastName, `%${query}%`),
        like(clients.email, `%${query}%`),
        like(clients.company, `%${query}%`)
      )
    )
    .orderBy(desc(clients.createdAt));
}

// ============================================================================
// PROJECTS
// ============================================================================

export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProjectsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(projects)
    .where(eq(projects.clientId, clientId))
    .orderBy(desc(projects.createdAt));
}

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values(data);
  return Number(result[0].insertId);
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projects).where(eq(projects.id, id));
}

// ============================================================================
// TASKS
// ============================================================================

export async function getAllTasks() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTasksByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(desc(tasks.createdAt));
}

export async function getTasksByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(tasks)
    .where(eq(tasks.clientId, clientId))
    .orderBy(desc(tasks.createdAt));
}

export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tasks).values(data);
  return Number(result[0].insertId);
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(tasks).where(eq(tasks.id, id));
}

// ============================================================================
// TIME ENTRIES
// ============================================================================

export async function getAllTimeEntries() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(timeEntries).orderBy(desc(timeEntries.startTime));
}

export async function getTimeEntriesByTaskId(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(timeEntries)
    .where(eq(timeEntries.taskId, taskId))
    .orderBy(desc(timeEntries.startTime));
}

export async function createTimeEntry(data: InsertTimeEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(timeEntries).values(data);
  return Number(result[0].insertId);
}

export async function updateTimeEntry(id: number, data: Partial<InsertTimeEntry>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(timeEntries).set(data).where(eq(timeEntries.id, id));
}

export async function deleteTimeEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(timeEntries).where(eq(timeEntries.id, id));
}

// ============================================================================
// DOCUMENTS
// ============================================================================

export async function getAllDocuments() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(documents).orderBy(desc(documents.date));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDocumentsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(documents)
    .where(eq(documents.clientId, clientId))
    .orderBy(desc(documents.date));
}

export async function createDocument(data: Omit<InsertDocument, 'number' | 'totalHt' | 'totalTva' | 'totalTtc'> & { lines: Array<{
  description: string;
  quantity: string;
  unit: string;
  unitPriceHt: string;
  tvaRate: string;
}> }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculer les totaux
  let totalHt = 0;
  let totalTva = 0;
  
  for (const line of data.lines) {
    const quantity = parseFloat(line.quantity);
    const unitPrice = parseFloat(line.unitPriceHt);
    const tvaRate = parseFloat(line.tvaRate);
    
    const lineTotal = quantity * unitPrice;
    totalHt += lineTotal;
    totalTva += lineTotal * (tvaRate / 100);
  }
  
  const totalTtc = totalHt + totalTva;
  
  // Générer le numéro de document
  const year = new Date().getFullYear();
  const prefix = data.type === "quote" ? "DEV" : data.type === "invoice" ? "FACT" : "AV";
  
  const existingDocs = await db
    .select()
    .from(documents)
    .where(like(documents.number, `${prefix}-${year}-%`));
  
  const nextNum = existingDocs.length + 1;
  const number = `${prefix}-${year}-${String(nextNum).padStart(3, "0")}`;
  
  // Créer le document
  const { lines, ...documentData } = data;
  const result = await db.insert(documents).values({
    ...documentData,
    number,
    totalHt: totalHt.toFixed(2),
    totalTva: totalTva.toFixed(2),
    totalTtc: totalTtc.toFixed(2),
  });
  
  const documentId = Number(result[0].insertId);
  
  // Créer les lignes
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const quantity = parseFloat(line.quantity);
    const unitPrice = parseFloat(line.unitPriceHt);
    const tvaRate = parseFloat(line.tvaRate);
    
    const lineTotalHt = quantity * unitPrice;
    const lineTotalTva = lineTotalHt * (tvaRate / 100);
    const lineTotalTtc = lineTotalHt + lineTotalTva;
    
    await db.insert(documentLines).values({
      documentId,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPriceHt: line.unitPriceHt,
      tvaRate: line.tvaRate,
      totalHt: lineTotalHt.toFixed(2),
      totalTva: lineTotalTva.toFixed(2),
      totalTtc: lineTotalTtc.toFixed(2),
      sortOrder: i + 1,
    });
  }
  
  return documentId;
}

export async function getNextDocumentNumber(type: "quote" | "invoice" | "credit_note") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const year = new Date().getFullYear();
  const prefix = type === "quote" ? "DEV" : type === "invoice" ? "FACT" : "AV";
  
  const existingDocs = await db
    .select()
    .from(documents)
    .where(like(documents.number, `${prefix}-${year}-%`));
  
  const nextNum = existingDocs.length + 1;
  return `${prefix}-${year}-${String(nextNum).padStart(3, "0")}`;
}

export async function updateDocument(id: number, data: Partial<InsertDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(documents).set(data).where(eq(documents.id, id));
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(documents).where(eq(documents.id, id));
}

// ============================================================================
// DOCUMENT LINES
// ============================================================================

export async function getDocumentLinesByDocumentId(documentId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(documentLines)
    .where(eq(documentLines.documentId, documentId))
    .orderBy(documentLines.sortOrder);
}

export async function createDocumentLine(data: InsertDocumentLine) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(documentLines).values(data);
  return Number(result[0].insertId);
}

export async function updateDocumentLine(id: number, data: Partial<InsertDocumentLine>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(documentLines).set(data).where(eq(documentLines.id, id));
}

export async function deleteDocumentLine(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(documentLines).where(eq(documentLines.id, id));
}

export async function deleteDocumentLinesByDocumentId(documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(documentLines).where(eq(documentLines.documentId, documentId));
}

// ============================================================================
// STATISTICS
// ============================================================================

export async function getStats() {
  const db = await getDb();
  if (!db) return {
    totalClients: 0,
    activeProjects: 0,
    pendingTasks: 0,
    totalRevenue: 0,
  };

  const [clientsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(clients);

  const [projectsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(eq(projects.status, "active"));

  const [tasksCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(or(eq(tasks.status, "todo"), eq(tasks.status, "in_progress")));

  const [revenue] = await db
    .select({ total: sql<number>`sum(totalTtc)` })
    .from(documents)
    .where(eq(documents.status, "paid"));

  return {
    totalClients: Number(clientsCount?.count || 0),
    activeProjects: Number(projectsCount?.count || 0),
    pendingTasks: Number(tasksCount?.count || 0),
    totalRevenue: Number(revenue?.total || 0),
  };
}

// ============================================================================
// CLIENT REQUESTS
// ============================================================================

export async function createClientRequest(data: {
  clientId: number;
  requestType: string;
  title: string;
  description: string;
  context?: string;
  budget: number;
  deadline: string;
  priority: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clientRequests).values({
    clientId: data.clientId,
    requestType: data.requestType as "coaching" | "website" | "app" | "ia_integration" | "optimization" | "other",
    title: data.title,
    description: data.description + (data.context ? `\n\nContexte: ${data.context}` : ""),
    budget: String(data.budget),
    deadline: new Date(data.deadline),
    priority: data.priority as "low" | "medium" | "high" | "urgent",
    status: "pending",
  });

  return Number(result[0].insertId);
}

export async function getAllClientRequests() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(clientRequests)
    .orderBy(desc(clientRequests.createdAt));
}

export async function getClientRequestById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(clientRequests)
    .where(eq(clientRequests.id, id))
    .limit(1);

  return result[0] || null;
}

export async function getClientRequestsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(clientRequests)
    .where(eq(clientRequests.clientId, clientId))
    .orderBy(desc(clientRequests.createdAt));
}

export async function updateClientRequest(id: number, data: {
  status?: "pending" | "in_review" | "accepted" | "in_progress" | "completed" | "rejected";
  adminNotes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(clientRequests)
    .set(data)
    .where(eq(clientRequests.id, id));

  return true;
}

// ============================================================================
// PROJECT CREDENTIALS (Coffre-fort RGPD)
// ============================================================================

export async function createProjectCredential(data: {
  projectId: number;
  category: "hosting" | "api" | "smtp" | "domain" | "cms" | "database" | "other";
  label: string;
  description?: string | null;
  encryptedData: string;
  url?: string | null;
  expiresAt?: Date | null;
  notes?: string | null;
  sharedBy?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projectCredentials).values({
    projectId: data.projectId,
    category: data.category,
    label: data.label,
    description: data.description,
    encryptedData: data.encryptedData,
    url: data.url,
    expiresAt: data.expiresAt,
    notes: data.notes,
    sharedBy: data.sharedBy,
    sharedAt: data.sharedBy ? new Date() : undefined,
    isActive: true,
  });

  return Number(result[0].insertId);
}

export async function getProjectCredentials(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(projectCredentials)
    .where(eq(projectCredentials.projectId, projectId))
    .orderBy(projectCredentials.createdAt);
}

export async function getProjectCredentialById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(projectCredentials)
    .where(eq(projectCredentials.id, id))
    .limit(1);

  return result[0] || null;
}

export async function updateProjectCredential(id: number, data: {
  label?: string;
  description?: string | null;
  encryptedData?: string;
  url?: string | null;
  expiresAt?: Date | null;
  notes?: string | null;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(projectCredentials)
    .set(data)
    .where(eq(projectCredentials.id, id));
}

export async function deleteProjectCredential(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(projectCredentials)
    .where(eq(projectCredentials.id, id));
}

export async function logCredentialAccess(data: {
  credentialId: number;
  accessedBy: number;
  accessType: "view" | "edit" | "delete";
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(credentialAccessLogs).values(data);

  // Mettre à jour les stats d'accès du credential
  await db
    .update(projectCredentials)
    .set({
      lastAccessedBy: data.accessedBy,
      lastAccessedAt: new Date(),
      accessCount: sql`${projectCredentials.accessCount} + 1`,
    })
    .where(eq(projectCredentials.id, data.credentialId));
}

export async function getCredentialAccessLogs(credentialId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(credentialAccessLogs)
    .where(eq(credentialAccessLogs.credentialId, credentialId))
    .orderBy(credentialAccessLogs.accessedAt);
}

// ============================================================================
// PROJECT REQUIREMENTS (Cahier des charges)
// ============================================================================

export async function createProjectRequirement(data: {
  projectId: number;
  title: string;
  description?: string | null;
  objectives?: string | null;
  scope?: string | null;
  constraints?: string | null;
  deliverables?: string | null;
  timeline?: string | null;
  budget?: string | null;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projectRequirements).values({
    ...data,
    version: 1,
    status: "draft",
  });

  return Number(result[0].insertId);
}

export async function getProjectRequirements(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(projectRequirements)
    .where(eq(projectRequirements.projectId, projectId))
    .orderBy(projectRequirements.version);
}

export async function getProjectRequirementById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(projectRequirements)
    .where(eq(projectRequirements.id, id))
    .limit(1);

  return result[0] || null;
}

export async function updateProjectRequirement(id: number, data: {
  title?: string;
  description?: string | null;
  objectives?: string | null;
  scope?: string | null;
  constraints?: string | null;
  deliverables?: string | null;
  timeline?: string | null;
  budget?: string | null;
  status?: "draft" | "review" | "approved" | "archived";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(projectRequirements)
    .set(data)
    .where(eq(projectRequirements.id, id));
}

export async function approveProjectRequirement(id: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(projectRequirements)
    .set({
      status: "approved",
      approvedAt: new Date(),
      approvedBy,
    })
    .where(eq(projectRequirements.id, id));
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function updateUser(userId: number, data: {
  name?: string;
  email?: string;
  phone?: string | null;
  avatarUrl?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set(data)
    .where(eq(users.id, userId));
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0] || null;
}

// ============================================================================
// REVIEWS (Avis et notations)
// ============================================================================

export async function createReview(data: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reviews).values(data);
  return result[0].insertId;
}

export async function getReviews(filters?: {
  clientId?: number;
  projectId?: number;
  isPublic?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(reviews);

  if (filters?.clientId) {
    query = query.where(eq(reviews.clientId, filters.clientId)) as any;
  }
  if (filters?.projectId) {
    query = query.where(eq(reviews.projectId, filters.projectId)) as any;
  }
  if (filters?.isPublic !== undefined) {
    query = query.where(eq(reviews.isPublic, filters.isPublic)) as any;
  }

  const result = await query.orderBy(desc(reviews.createdAt));
  return result;
}

export async function getReviewById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, id))
    .limit(1);

  return result[0] || null;
}

export async function updateReview(id: number, data: Partial<InsertReview>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(reviews)
    .set(data)
    .where(eq(reviews.id, id));
}

export async function deleteReview(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(reviews)
    .where(eq(reviews.id, id));
}

export async function respondToReview(id: number, response: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(reviews)
    .set({
      response,
      respondedAt: new Date(),
    })
    .where(eq(reviews.id, id));
}

export async function getAverageRating() {
  const db = await getDb();
  if (!db) return { average: 0, count: 0 };

  const result = await db
    .select()
    .from(reviews)
    .where(eq(reviews.isPublic, true));

  if (result.length === 0) {
    return { average: 0, count: 0 };
  }

  const sum = result.reduce((acc, review) => acc + review.rating, 0);
  const average = sum / result.length;

  return {
    average: Math.round(average * 10) / 10, // Arrondir à 1 décimale
    count: result.length,
  };
}

export async function getClientReviewsWithProjects(clientId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      review: reviews,
      project: projects,
    })
    .from(reviews)
    .leftJoin(projects, eq(reviews.projectId, projects.id))
    .where(eq(reviews.clientId, clientId))
    .orderBy(desc(reviews.createdAt));

  return result;
}
