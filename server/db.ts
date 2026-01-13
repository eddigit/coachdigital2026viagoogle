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

export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(documents).values(data);
  return Number(result[0].insertId);
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
