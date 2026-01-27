import { db } from "./firestore";
import {
  User, InsertUser,
  Company, InsertCompany,
  Client, InsertClient,
  Project, InsertProject,
  Task, InsertTask,
  TimeEntry, InsertTimeEntry,
  Document, InsertDocument,
  DocumentLine, InsertDocumentLine,
  ClientRequest,
  ProjectCredential,
  CredentialAccessLog,
  ProjectRequirement,
  InsertProjectRequirement,
  ClientUser
} from "./schema";
import { ENV } from "./_core/env";

// Helper to get next numeric ID (for compatibility with existing frontend/router types)
export async function getNextId(collection: string): Promise<number> {
  const counterRef = db.collection('_counters').doc(collection);
  try {
    const res = await db.runTransaction(async (t) => {
      const doc = await t.get(counterRef);
      const newId = (doc.exists ? doc.data()!.count : 0) + 1;
      t.set(counterRef, { count: newId });
      return newId;
    });
    return res;
  } catch (error) {
    console.error(`Failed to generate ID for ${collection}:`, error);
    throw error;
  }
}

// Helper to map Firestore doc to typed object
const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

// Mock getDb for compatibility if needed (returns Firestore instance actually)
export async function getDb() {
  return db;
}

// ============================================================================
// USERS
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('openId', '==', user.openId).limit(1).get();

  let userDocRef: FirebaseFirestore.DocumentReference;
  let currentData: Partial<User> = {};

  if (!snapshot.empty) {
    userDocRef = snapshot.docs[0].ref;
    currentData = snapshot.docs[0].data() as User;
  } else {
    // New user
    const newId = await getNextId('users');
    userDocRef = usersRef.doc(String(newId));
    currentData = { id: newId, createdAt: new Date() };
  }

  const updates: any = { ...user };

  // Default role
  if (!updates.role && !currentData.role) {
    updates.role = user.openId === ENV.ownerOpenId ? "admin" : "user";
  }

  // Timestamps
  updates.updatedAt = new Date();
  if (!updates.lastSignedIn) updates.lastSignedIn = new Date();

  await userDocRef.set({ ...currentData, ...updates }, { merge: true });
}

export async function getClientUserById(id: number | string) {
  const doc = await db.collection('clientUsers').doc(String(id)).get();
  if (!doc.exists) return undefined;
  return mapDoc<ClientUser>(doc);
}

export async function getUserByOpenId(openId: string) {
  const snapshot = await db.collection('users').where('openId', '==', openId).limit(1).get();
  if (snapshot.empty) return undefined;
  return mapDoc<User>(snapshot.docs[0]);
}

export async function updateUser(id: number | string, data: Partial<User>) {
  await db.collection('users').doc(String(id)).update({
    ...data,
    updatedAt: new Date()
  });
}

// ============================================================================
// COMPANY
// ============================================================================

export async function getCompany() {
  const snapshot = await db.collection('company').limit(1).get();
  if (snapshot.empty) return undefined;
  return mapDoc<Company>(snapshot.docs[0]);
}

export async function upsertCompany(data: InsertCompany) {
  const snapshot = await db.collection('company').limit(1).get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    await doc.ref.update({ ...data, updatedAt: new Date() });
    return Number(doc.id);
  } else {
    const newId = await getNextId('company');
    await db.collection('company').doc(String(newId)).set({
      ...data,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return newId;
  }
}

// ============================================================================
// CLIENTS
// ============================================================================

export async function getAllClients() {
  const snapshot = await db.collection('clients').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => mapDoc<Client>(doc));
}

export async function getClientById(id: number | string) {
  const doc = await db.collection('clients').doc(String(id)).get();
  if (!doc.exists) return undefined;
  return mapDoc<Client>(doc);
}

export async function createClient(data: InsertClient) {
  const newId = await getNextId('clients');
  await db.collection('clients').doc(String(newId)).set({
    ...data,
    id: newId,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return newId;
}

export async function updateClient(id: number | string, data: Partial<InsertClient>) {
  await db.collection('clients').doc(String(id)).update({
    ...data,
    updatedAt: new Date()
  });
}

export async function deleteClient(id: number | string) {
  await db.collection('clients').doc(String(id)).delete();
}

export async function searchClients(query: string) {
  // Simple search implementation (client-side filtering might be better for small datasets, strict equality for Firestore)
  // For now return all and filter? Or just prefix search?
  // Firestore doesn't support full-text search easily.
  // We'll return all and filter in memory since dataset is small for a freelancer.
  const all = await getAllClients();
  const lowerQ = query.toLowerCase();
  return all.filter(c =>
    c.firstName.toLowerCase().includes(lowerQ) ||
    c.lastName.toLowerCase().includes(lowerQ) ||
    (c.email && c.email.toLowerCase().includes(lowerQ)) ||
    (c.company && c.company.toLowerCase().includes(lowerQ))
  );
}

// ============================================================================
// PROJECTS
// ============================================================================

export async function getAllProjects() {
  const snapshot = await db.collection('projects').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => mapDoc<Project>(doc));
}

export async function getProjectById(id: number | string) {
  const doc = await db.collection('projects').doc(String(id)).get();
  if (!doc.exists) return undefined;
  return mapDoc<Project>(doc);
}

export async function getProjectsByClientId(clientId: number | string) {
  const snapshot = await db.collection('projects').where('clientId', '==', clientId).orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => mapDoc<Project>(doc));
}

export async function createProject(data: InsertProject) {
  const newId = await getNextId('projects');
  await db.collection('projects').doc(String(newId)).set({
    ...data,
    id: newId,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return newId;
}

export async function updateProject(id: number | string, data: Partial<InsertProject>) {
  await db.collection('projects').doc(String(id)).update({
    ...data,
    updatedAt: new Date()
  });
}

export async function deleteProject(id: number | string) {
  await db.collection('projects').doc(String(id)).delete();
}

// ============================================================================
// TASKS
// ============================================================================

export async function getAllTasks() {
  const snapshot = await db.collection('tasks').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => mapDoc<Task>(doc));
}

export async function getTaskById(id: number | string) {
  const doc = await db.collection('tasks').doc(String(id)).get();
  if (!doc.exists) return undefined;
  return mapDoc<Task>(doc);
}

export async function getTasksByProjectId(projectId: number | string) {
  const snapshot = await db.collection('tasks').where('projectId', '==', projectId).orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => mapDoc<Task>(doc));
}

export async function getTasksByClientId(clientId: number | string) {
  const snapshot = await db.collection('tasks').where('clientId', '==', clientId).orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => mapDoc<Task>(doc));
}

export async function createTask(data: InsertTask) {
  const newId = await getNextId('tasks');
  await db.collection('tasks').doc(String(newId)).set({
    ...data,
    id: newId,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return newId;
}

export async function updateTask(id: number | string, data: Partial<InsertTask>) {
  await db.collection('tasks').doc(String(id)).update({
    ...data,
    updatedAt: new Date()
  });
}

export async function deleteTask(id: number | string) {
  await db.collection('tasks').doc(String(id)).delete();
}

// ============================================================================
// TIME ENTRIES
// ============================================================================

export async function getAllTimeEntries() {
  const snapshot = await db.collection('timeEntries').orderBy('startTime', 'desc').get();
  return snapshot.docs.map(doc => mapDoc<TimeEntry>(doc));
}

export async function getTimeEntriesByTaskId(taskId: number | string) {
  const snapshot = await db.collection('timeEntries').where('taskId', '==', taskId).orderBy('startTime', 'desc').get();
  return snapshot.docs.map(doc => mapDoc<TimeEntry>(doc));
}

export async function createTimeEntry(data: InsertTimeEntry) {
  const newId = await getNextId('timeEntries');
  await db.collection('timeEntries').doc(String(newId)).set({
    ...data,
    id: newId,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return newId;
}

export async function updateTimeEntry(id: number | string, data: Partial<InsertTimeEntry>) {
  await db.collection('timeEntries').doc(String(id)).update({
    ...data,
    updatedAt: new Date()
  });
}

export async function deleteTimeEntry(id: number | string) {
  await db.collection('timeEntries').doc(String(id)).delete();
}

// ============================================================================
// DOCUMENTS
// ============================================================================

export async function getAllDocuments() {
  const snapshot = await db.collection('documents').orderBy('date', 'desc').get();
  return snapshot.docs.map(doc => mapDoc<Document>(doc));
}

export async function getDocumentById(id: number | string) {
  const doc = await db.collection('documents').doc(String(id)).get();
  if (!doc.exists) return undefined;
  return mapDoc<Document>(doc);
}

export async function getDocumentsByClientId(clientId: number | string) {
  const snapshot = await db.collection('documents').where('clientId', '==', clientId).orderBy('date', 'desc').get();
  return snapshot.docs.map(doc => mapDoc<Document>(doc));
}

export async function createDocument(data: any) {
  // Logic from original db.ts including total calc
  const { lines, ...documentData } = data;

  // Calculate totals
  let totalHt = 0;
  let totalTva = 0;

  for (const line of lines) {
    const quantity = parseFloat(line.quantity);
    const unitPrice = parseFloat(line.unitPriceHt);
    const tvaRate = parseFloat(line.tvaRate);

    const lineTotal = quantity * unitPrice;
    totalHt += lineTotal;
    totalTva += lineTotal * (tvaRate / 100);
  }

  const totalTtc = totalHt + totalTva;

  // Generate Number
  const nextNumStr = await getNextDocumentNumber(documentData.type);
  const number = nextNumStr;

  const newId = await getNextId('documents');

  await db.collection('documents').doc(String(newId)).set({
    ...documentData,
    id: newId,
    number,
    totalHt: totalHt.toFixed(2),
    totalTva: totalTva.toFixed(2),
    totalTtc: totalTtc.toFixed(2),
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Create lines in subcollection
  const batch = db.batch();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // We can use random IDs for lines or counter. Since they are subcollection, random is fine or just index.
    // Drizzle used auto-increment.
    // Let's use simple IDs like "line_1", "line_2" etc
    const lineId = await getNextId('documentLines');
    // Optimization: using global counter for lines might be slow if many lines. 
    // But consistent with other entities.

    const quantity = parseFloat(line.quantity);
    const unitPrice = parseFloat(line.unitPriceHt);
    const tvaRate = parseFloat(line.tvaRate);

    const lineTotalHt = quantity * unitPrice;
    const lineTotalTva = lineTotalHt * (tvaRate / 100);
    const lineTotalTtc = lineTotalHt + lineTotalTva;

    const lineRef = db.collection('documents').doc(String(newId)).collection('lines').doc(String(lineId));
    batch.set(lineRef, {
      id: lineId,
      documentId: newId,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPriceHt: line.unitPriceHt,
      tvaRate: line.tvaRate,
      totalHt: lineTotalHt.toFixed(2),
      totalTva: lineTotalTva.toFixed(2),
      totalTtc: lineTotalTtc.toFixed(2),
      sortOrder: i + 1,
      createdAt: new Date()
    });
  }
  await batch.commit();

  return newId;
}

export async function getNextDocumentNumber(type: "quote" | "invoice" | "credit_note") {
  const year = new Date().getFullYear();
  const prefix = type === "quote" ? "DEV" : type === "invoice" ? "FACT" : "AV";
  const pattern = `${prefix}-${year}-`;

  const snapshot = await db.collection('documents')
    .where('number', '>=', pattern)
    .where('number', '<=', pattern + '\uf8ff')
    .get();

  const nextNum = snapshot.size + 1;
  return `${prefix}-${year}-${String(nextNum).padStart(3, "0")}`;
}

export async function updateDocument(id: number | string, data: Partial<InsertDocument>) {
  await db.collection('documents').doc(String(id)).update({
    ...data,
    updatedAt: new Date()
  });
}

export async function replaceDocumentLines(documentId: number | string, lines: InsertDocumentLine[]) {
  // Delete existing lines
  const existingLines = await db.collection('documents').doc(String(documentId)).collection('lines').get();
  const batch = db.batch();
  existingLines.docs.forEach(doc => batch.delete(doc.ref));

  // Insert new lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineId = await getNextId('documentLines');
    const quantity = parseFloat(String(line.quantity || 0));
    const unitPrice = parseFloat(String(line.unitPriceHt || 0));
    const tvaRate = parseFloat(String(line.tvaRate || 0));

    const lineTotalHt = quantity * unitPrice;
    const lineTotalTva = lineTotalHt * (tvaRate / 100);
    const lineTotalTtc = lineTotalHt + lineTotalTva;

    const lineRef = db.collection('documents').doc(String(documentId)).collection('lines').doc(String(lineId));
    batch.set(lineRef, {
      id: lineId,
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
      createdAt: new Date()
    });
  }

  await batch.commit();
}

export async function deleteDocument(id: number | string) {
  // Also delete lines? Firestore doesn't cascade delete subcollections automatically.
  // We should delete subcollection lines.
  const lines = await db.collection('documents').doc(String(id)).collection('lines').get();
  const batch = db.batch();
  lines.docs.forEach(d => batch.delete(d.ref));
  batch.delete(db.collection('documents').doc(String(id)));
  await batch.commit();
}

// ============================================================================
// DOCUMENT LINES
// ============================================================================

export async function getDocumentLinesByDocumentId(documentId: number | string) {
  const snapshot = await db.collection('documents').doc(String(documentId)).collection('lines').orderBy('sortOrder').get();
  return snapshot.docs.map(doc => mapDoc<DocumentLine>(doc));
}

// ============================================================================
// STATISTICS
// ============================================================================

export async function getStats() {
  const clientsCount = (await db.collection('clients').count().get()).data().count;
  const projectsCount = (await db.collection('projects').where('status', '==', 'active').count().get()).data().count;
  const tasksTodo = (await db.collection('tasks').where('status', '==', 'todo').count().get()).data().count;
  const tasksInProgress = (await db.collection('tasks').where('status', '==', 'in_progress').count().get()).data().count;

  // Revenue: sum totalTtc where status = paid
  const paidDocs = await db.collection('documents').where('status', '==', 'paid').get();
  const revenue = paidDocs.docs.reduce((acc, doc) => acc + parseFloat(doc.data().totalTtc || '0'), 0);

  return {
    totalClients: clientsCount,
    activeProjects: projectsCount,
    pendingTasks: tasksTodo + tasksInProgress,
    totalRevenue: revenue
  };
}

// ============================================================================
// CLIENT REQUESTS
// ============================================================================

export async function createClientRequest(data: any) {
  const newId = await getNextId('clientRequests');
  await db.collection('clientRequests').doc(String(newId)).set({
    ...data,
    id: newId,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return newId;
}

export async function getAllClientRequests() {
  const snapshot = await db.collection('clientRequests').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => mapDoc<ClientRequest>(doc));
}

export async function getClientRequestById(id: number | string) {
  const doc = await db.collection('clientRequests').doc(String(id)).get();
  if (!doc.exists) return null;
  return mapDoc<ClientRequest>(doc);
}

// ============================================================================
// PROJECT CREDENTIALS
// ============================================================================

export async function createProjectCredential(data: any) {
  const newId = await getNextId('projectCredentials');
  await db.collection('projectCredentials').doc(String(newId)).set({
    ...data,
    id: newId,
    sharedAt: data.sharedBy ? new Date() : undefined,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    accessCount: 0
  });
  return newId;
}

export async function getProjectCredentials(projectId: number | string) {
  const snapshot = await db.collection('projectCredentials').where('projectId', '==', projectId).get();
  return snapshot.docs.map(doc => mapDoc<ProjectCredential>(doc));
}

export async function getProjectCredentialById(id: number | string) {
  const doc = await db.collection('projectCredentials').doc(String(id)).get();
  if (!doc.exists) return null;
  return mapDoc<ProjectCredential>(doc);
}

export async function logCredentialAccess(data: any) {
  await db.collection('credentialAccessLogs').add({
    ...data,
    accessedAt: new Date()
  });
  // Update counter
  await db.collection('projectCredentials').doc(String(data.credentialId)).update({
    lastAccessedBy: data.accessedBy,
    lastAccessedAt: new Date(),
  });
}

export async function getCredentialAccessLogs(credentialId: number | string) {
  const snapshot = await db.collection('credentialAccessLogs').where('credentialId', '==', credentialId).orderBy('accessedAt', 'desc').get();
  return snapshot.docs.map(doc => mapDoc<CredentialAccessLog>(doc));
}

export async function updateProjectCredential(id: number | string, data: Partial<ProjectCredential>) {
  await db.collection('projectCredentials').doc(String(id)).update({
    ...data,
    updatedAt: new Date()
  });
}

export async function deleteProjectCredential(id: number | string) {
  await db.collection('projectCredentials').doc(String(id)).delete();
}

// ============================================================================
// PROJECT REQUIREMENTS
// ============================================================================

export async function createProjectRequirement(data: any) {
  const newId = await getNextId('projectRequirements');
  await db.collection('projectRequirements').doc(String(newId)).set({
    ...data,
    id: newId,
    version: 1,
    status: "draft",
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return newId;
}

export async function getProjectRequirements(projectId: number | string) {
  const snapshot = await db.collection('projectRequirements').where('projectId', '==', projectId).orderBy('version', 'desc').get();
  return snapshot.docs.map(doc => mapDoc<ProjectRequirement>(doc));
}

export async function getProjectRequirementById(id: number | string) {
  const doc = await db.collection('projectRequirements').doc(String(id)).get();
  if (!doc.exists) return null;
  return mapDoc<ProjectRequirement>(doc);
}

export async function updateProjectRequirement(id: number | string, data: Partial<InsertProjectRequirement>) {
  await db.collection('projectRequirements').doc(String(id)).update({
    ...data,
    updatedAt: new Date()
  });
}

export async function approveProjectRequirement(id: number | string, userId: number | string) {
  await db.collection('projectRequirements').doc(String(id)).update({
    status: "approved",
    approvedAt: new Date(),
    approvedBy: userId,
    updatedAt: new Date()
  });
}

export async function getAllProjectRequirements() {
  const snapshot = await db.collection('projectRequirements').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => mapDoc<ProjectRequirement>(doc));
}
