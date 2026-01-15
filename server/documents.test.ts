import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { documents, documentLines, clients } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Documents Router", () => {
  let testClientId: number;
  let testDocumentId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const existingClients = await db.select().from(clients).limit(1);
    if (existingClients.length > 0) {
      testClientId = existingClients[0].id;
    } else {
      const result = await db.insert(clients).values({
        firstName: "Test",
        lastName: "Client",
        email: "test@example.com",
      });
      testClientId = Number(result[0].insertId);
    }
  });

  it("devrait créer un devis", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(documents).values({
      clientId: testClientId,
      type: "quote",
      number: "DEV-TEST-001",
      status: "draft",
      date: new Date(),
      totalHt: "1000.00",
      totalTva: "200.00",
      totalTtc: "1200.00",
    });

    testDocumentId = Number(result[0].insertId);
    expect(testDocumentId).toBeGreaterThan(0);
  });

  it("devrait ajouter des lignes au document", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(documentLines).values({
      documentId: testDocumentId,
      description: "Prestation de coaching",
      quantity: "10",
      unit: "heures",
      unitPriceHt: "100.00",
      tvaRate: "20.00",
      totalHt: "1000.00",
      totalTva: "200.00",
      totalTtc: "1200.00",
      sortOrder: 1,
    });

    expect(result).toBeDefined();
  });

  it("devrait récupérer un document avec ses lignes", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const doc = await db
      .select()
      .from(documents)
      .where(eq(documents.id, testDocumentId))
      .limit(1);

    expect(doc.length).toBe(1);
    expect(doc[0].number).toBe("DEV-TEST-001");

    const lines = await db
      .select()
      .from(documentLines)
      .where(eq(documentLines.documentId, testDocumentId));

    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0].description).toBe("Prestation de coaching");
  });

  it("devrait mettre à jour le statut d'un document", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(documents)
      .set({ status: "sent" })
      .where(eq(documents.id, testDocumentId));

    const updated = await db
      .select()
      .from(documents)
      .where(eq(documents.id, testDocumentId))
      .limit(1);

    expect(updated[0].status).toBe("sent");
  });

  it("devrait calculer les totaux correctement", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const lines = await db
      .select()
      .from(documentLines)
      .where(eq(documentLines.documentId, testDocumentId));

    const totalHt = lines.reduce((sum, l) => sum + parseFloat(l.totalHt || "0"), 0);
    const totalTva = lines.reduce((sum, l) => sum + parseFloat(l.totalTva || "0"), 0);
    const totalTtc = lines.reduce((sum, l) => sum + parseFloat(l.totalTtc || "0"), 0);

    expect(totalHt).toBe(1000);
    expect(totalTva).toBe(200);
    expect(totalTtc).toBe(1200);
  });

  it("devrait supprimer un document et ses lignes", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.delete(documentLines).where(eq(documentLines.documentId, testDocumentId));
    await db.delete(documents).where(eq(documents.id, testDocumentId));

    const deleted = await db
      .select()
      .from(documents)
      .where(eq(documents.id, testDocumentId));

    expect(deleted.length).toBe(0);
  });
});
