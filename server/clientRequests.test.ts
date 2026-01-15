import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { clientRequests, clients } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Client Requests", () => {
  let testClientId: number;
  let testRequestId: number;

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
        email: "test.requests@example.com",
      });
      testClientId = Number(result[0].insertId);
    }
  });

  it("devrait créer une demande client", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(clientRequests).values({
      clientId: testClientId,
      requestType: "website",
      title: "Création site vitrine",
      description: "Je souhaite un site vitrine pour mon cabinet d'avocat",
      budget: "3000.00",
      deadline: new Date("2026-03-01"),
      priority: "medium",
      status: "pending",
    });

    testRequestId = Number(result[0].insertId);
    expect(testRequestId).toBeGreaterThan(0);
  });

  it("devrait récupérer les demandes d'un client", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const requests = await db
      .select()
      .from(clientRequests)
      .where(eq(clientRequests.clientId, testClientId));

    expect(requests.length).toBeGreaterThan(0);
    expect(requests[0].title).toBe("Création site vitrine");
  });

  it("devrait mettre à jour le statut d'une demande", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(clientRequests)
      .set({ status: "in_review", adminNotes: "Demande en cours d'analyse" })
      .where(eq(clientRequests.id, testRequestId));

    const updated = await db
      .select()
      .from(clientRequests)
      .where(eq(clientRequests.id, testRequestId))
      .limit(1);

    expect(updated[0].status).toBe("in_review");
    expect(updated[0].adminNotes).toBe("Demande en cours d'analyse");
  });

  it("devrait filtrer les demandes par statut", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const pending = await db
      .select()
      .from(clientRequests)
      .where(eq(clientRequests.status, "pending"));

    const inReview = await db
      .select()
      .from(clientRequests)
      .where(eq(clientRequests.status, "in_review"));

    expect(inReview.length).toBeGreaterThan(0);
  });

  it("devrait supprimer une demande", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.delete(clientRequests).where(eq(clientRequests.id, testRequestId));

    const deleted = await db
      .select()
      .from(clientRequests)
      .where(eq(clientRequests.id, testRequestId));

    expect(deleted.length).toBe(0);
  });
});
