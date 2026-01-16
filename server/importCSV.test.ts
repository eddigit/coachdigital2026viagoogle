import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { leads } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

describe("Import CSV Optimisé - Tests de Performance", () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Nettoyer les leads de test avant les tests
    await db.delete(leads).where(eq(leads.source, "Test Performance"));
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Nettoyer les leads de test après les tests
    await db.delete(leads).where(eq(leads.source, "Test Performance"));
  });

  it("devrait insérer un batch de 500 leads en moins de 5 secondes", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const BATCH_SIZE = 500;
    const testLeads = [];
    
    for (let i = 0; i < BATCH_SIZE; i++) {
      testLeads.push({
        firstName: `Test${i}`,
        lastName: `Performance${i}`,
        email: `test.perf.${i}.${Date.now()}@test.fr`,
        phone: `06 00 00 00 ${String(i).padStart(2, '0')}`,
        company: `Entreprise Test ${i}`,
        position: "Test",
        status: "suspect" as const,
        potentialAmount: "5000",
        probability: 25,
        source: "Test Performance",
        notes: `Lead de test #${i}`,
      });
    }

    const startTime = Date.now();
    
    // Insertion batch
    await db.insert(leads).values(testLeads);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`Insertion de ${BATCH_SIZE} leads en ${duration.toFixed(2)} secondes`);
    
    expect(duration).toBeLessThan(5);
    
    // Vérifier que les leads ont été insérés
    const inserted = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.source, "Test Performance"));
    
    expect(Number(inserted[0].count)).toBeGreaterThanOrEqual(BATCH_SIZE);
  });

  it("devrait détecter les doublons efficacement", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Récupérer tous les emails existants
    const startTime = Date.now();
    
    const existingEmails = new Set<string>();
    const allExisting = await db.select({ email: leads.email }).from(leads);
    for (const row of allExisting) {
      if (row.email) existingEmails.add(row.email.toLowerCase());
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`Récupération de ${existingEmails.size} emails en ${duration.toFixed(2)} secondes`);
    
    // Même avec 30 000 emails, ça devrait prendre moins de 2 secondes
    expect(duration).toBeLessThan(2);
    expect(existingEmails.size).toBeGreaterThan(0);
  });
});
