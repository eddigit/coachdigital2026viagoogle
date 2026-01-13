import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import type { User } from "../drizzle/schema";

// Mock user pour les tests
const mockUser: User = {
  id: 1,
  openId: "test-open-id",
  name: "Test User",
  email: "test@example.com",
  phone: null,
  avatarUrl: null,
  loginMethod: "oauth",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

// Mock context
const createMockContext = () => ({
  user: mockUser,
  req: {} as any,
  res: {} as any,
});

describe("TimeEntries Router", () => {
  let testEntryId: number;
  const testDate = new Date().toISOString().split("T")[0];

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Nettoyer les entrées de test existantes
    await db.execute(`DELETE FROM timeEntries WHERE userId = ${mockUser.id}`);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    
    // Nettoyer après les tests
    await db.execute(`DELETE FROM timeEntries WHERE userId = ${mockUser.id}`);
  });

  it("devrait créer une entrée de temps", async () => {
    const caller = appRouter.createCaller(createMockContext());
    
    const result = await caller.timeEntries.create({
      title: "Test Entry",
      description: "Test description",
      date: testDate,
      period: "morning",
      type: "billable",
      hourlyRate: "80.00",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    testEntryId = result.id;
  });

  it("devrait lister les entrées par date", async () => {
    const caller = appRouter.createCaller(createMockContext());
    
    const entries = await caller.timeEntries.listByDate({ date: testDate });

    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].title).toBe("Test Entry");
    expect(entries[0].period).toBe("morning");
    expect(entries[0].type).toBe("billable");
  });

  it("devrait mettre à jour une entrée de temps", async () => {
    const caller = appRouter.createCaller(createMockContext());
    
    const result = await caller.timeEntries.update({
      id: testEntryId,
      title: "Updated Test Entry",
      description: "Updated description",
    });

    expect(result.success).toBe(true);

    // Vérifier la mise à jour
    const entries = await caller.timeEntries.listByDate({ date: testDate });
    const updatedEntry = entries.find((e) => e.id === testEntryId);
    expect(updatedEntry?.title).toBe("Updated Test Entry");
    expect(updatedEntry?.description).toBe("Updated description");
  });

  it("devrait démarrer et arrêter le chronomètre", async () => {
    const caller = appRouter.createCaller(createMockContext());
    
    // Démarrer le chronomètre
    const startResult = await caller.timeEntries.startTimer({ id: testEntryId });
    expect(startResult.success).toBe(true);

    // Vérifier le statut
    const entries = await caller.timeEntries.listByDate({ date: testDate });
    const runningEntry = entries.find((e) => e.id === testEntryId);
    expect(runningEntry?.status).toBe("in_progress");
    expect(runningEntry?.startTime).toBeDefined();

    // Attendre 1 seconde pour avoir une durée mesurable
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Arrêter le chronomètre
    const stopResult = await caller.timeEntries.stopTimer({ id: testEntryId });
    expect(stopResult.success).toBe(true);
    expect(stopResult.duration).toBeGreaterThan(0);

    // Vérifier la durée enregistrée
    const entriesAfterStop = await caller.timeEntries.listByDate({ date: testDate });
    const stoppedEntry = entriesAfterStop.find((e) => e.id === testEntryId);
    expect(stoppedEntry?.status).toBe("completed");
    expect(stoppedEntry?.duration).toBeGreaterThan(0);
    expect(stoppedEntry?.endTime).toBeDefined();
  });

  it("devrait lister les entrées par période", async () => {
    const caller = appRouter.createCaller(createMockContext());
    
    const startDate = testDate;
    const endDate = testDate;
    
    const entries = await caller.timeEntries.listByPeriod({ startDate, endDate });

    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
  });

  it("devrait calculer les statistiques par client", async () => {
    const caller = appRouter.createCaller(createMockContext());
    
    const startDate = testDate;
    const endDate = testDate;
    
    const stats = await caller.timeEntries.statsByClient({ startDate, endDate });

    expect(Array.isArray(stats)).toBe(true);
    // Les stats devraient contenir au moins une entrée (clientId 0 pour les entrées sans client)
    expect(stats.length).toBeGreaterThan(0);
  });

  it("devrait supprimer une entrée de temps", async () => {
    const caller = appRouter.createCaller(createMockContext());
    
    const result = await caller.timeEntries.delete({ id: testEntryId });
    expect(result.success).toBe(true);

    // Vérifier la suppression
    const entries = await caller.timeEntries.listByDate({ date: testDate });
    const deletedEntry = entries.find((e) => e.id === testEntryId);
    expect(deletedEntry).toBeUndefined();
  });

  it("devrait créer une entrée facturable avec client et projet", async () => {
    const caller = appRouter.createCaller(createMockContext());
    
    const result = await caller.timeEntries.create({
      title: "Billable Work",
      description: "Client project work",
      date: testDate,
      period: "afternoon",
      type: "billable",
      clientId: 1,
      projectId: 1,
      hourlyRate: "100.00",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();

    // Nettoyer
    await caller.timeEntries.delete({ id: result.id });
  });

  it("devrait créer une entrée non facturable", async () => {
    const caller = appRouter.createCaller(createMockContext());
    
    const result = await caller.timeEntries.create({
      title: "Admin Work",
      description: "Internal administration",
      date: testDate,
      period: "evening",
      type: "non_billable",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();

    // Vérifier
    const entries = await caller.timeEntries.listByDate({ date: testDate });
    const nonBillableEntry = entries.find((e) => e.id === result.id);
    expect(nonBillableEntry?.type).toBe("non_billable");
    expect(nonBillableEntry?.hourlyRate).toBeNull();

    // Nettoyer
    await caller.timeEntries.delete({ id: result.id });
  });
});
