import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { leads, emailTemplates } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Leads Router", () => {
  beforeAll(async () => {
    // Nettoyer les données de test
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    await db.delete(leads);
  });

  it("devrait créer un lead", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(leads).values({
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean.dupont@example.com",
      phone: "0601020304",
      company: "Cabinet Dupont",
      position: "Avocat",
      status: "suspect",
      potentialAmount: "5000",
      probability: 25,
      source: "LinkedIn",
    });

    expect(result).toBeDefined();
  });

  it("devrait récupérer les leads", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allLeads = await db.select().from(leads);
    expect(allLeads.length).toBeGreaterThan(0);
    expect(allLeads[0].firstName).toBe("Jean");
  });

  it("devrait mettre à jour le statut d'un lead", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allLeads = await db.select().from(leads);
    const leadId = allLeads[0].id;

    await db
      .update(leads)
      .set({ status: "analyse" })
      .where(eq(leads.id, leadId));

    const updated = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    expect(updated[0].status).toBe("analyse");
  });

  it("devrait récupérer les templates d'emails", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const templates = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.isActive, true));

    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0].name).toBeDefined();
    expect(templates[0].subject).toBeDefined();
    expect(templates[0].body).toBeDefined();
  });

  it("devrait calculer les statistiques du pipeline", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allLeads = await db.select().from(leads);

    const stats = {
      total: allLeads.length,
      suspect: allLeads.filter((l) => l.status === "suspect").length,
      analyse: allLeads.filter((l) => l.status === "analyse").length,
      negociation: allLeads.filter((l) => l.status === "negociation").length,
      conclusion: allLeads.filter((l) => l.status === "conclusion").length,
      totalPotential: allLeads.reduce((sum, l) => sum + parseFloat(l.potentialAmount || "0"), 0),
      weightedPotential: allLeads.reduce(
        (sum, l) => sum + parseFloat(l.potentialAmount || "0") * (l.probability || 0) / 100,
        0
      ),
    };

    expect(stats.total).toBeGreaterThan(0);
    expect(stats.totalPotential).toBeGreaterThan(0);
    expect(stats.weightedPotential).toBeGreaterThan(0);
    expect(stats.weightedPotential).toBeLessThan(stats.totalPotential);
  });
});
