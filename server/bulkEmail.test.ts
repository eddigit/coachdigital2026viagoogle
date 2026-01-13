import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { leads, emailCampaigns, emailQueue } from "../drizzle/schema";
import { eq, gte } from "drizzle-orm";

describe("Import CSV et Envoi de Masse", () => {
  beforeAll(async () => {
    // Nettoyer les données de test
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.delete(emailQueue);
    await db.delete(emailCampaigns);
    await db.delete(leads).where(eq(leads.source, "Test CSV"));
  });

  it("devrait importer des leads depuis un CSV simulé", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const csvLeads = [
      {
        firstName: "Marie",
        lastName: "Martin",
        email: "marie.martin@example.com",
        phone: "0601020304",
        company: "Cabinet Martin",
        position: "Avocate",
        status: "suspect" as const,
        potentialAmount: "8000",
        probability: 30,
        source: "Test CSV",
      },
      {
        firstName: "Pierre",
        lastName: "Durand",
        email: "pierre.durand@example.com",
        phone: "0602030405",
        company: "Durand & Associés",
        position: "Avocat",
        status: "suspect" as const,
        potentialAmount: "12000",
        probability: 40,
        source: "Test CSV",
      },
    ];

    for (const lead of csvLeads) {
      await db.insert(leads).values(lead);
    }

    const imported = await db.select().from(leads).where(eq(leads.source, "Test CSV"));

    expect(imported.length).toBe(2);
    expect(imported[0].firstName).toBe("Marie");
    expect(imported[1].firstName).toBe("Pierre");
  });

  it("devrait détecter les doublons par email", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const duplicateLead = {
      firstName: "Marie",
      lastName: "Martin",
      email: "marie.martin@example.com",
      source: "Test CSV",
    };

    // Vérifier si le lead existe déjà
    const existing = await db
      .select()
      .from(leads)
      .where(eq(leads.email, duplicateLead.email!))
      .limit(1);

    expect(existing.length).toBeGreaterThan(0);
  });

  it("devrait créer une campagne d'envoi de masse", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(emailCampaigns).values({
      name: "Test Campaign",
      subject: "Test Subject",
      body: "Test Body",
      status: "draft",
      totalRecipients: 2,
      createdBy: 1,
    });

    expect(result).toBeDefined();

    const campaigns = await db.select().from(emailCampaigns);
    expect(campaigns.length).toBeGreaterThan(0);
  });

  it("devrait ajouter des emails à la file d'attente", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const campaigns = await db.select().from(emailCampaigns).limit(1);
    const campaignId = campaigns[0].id;

    const testLeads = await db.select().from(leads).where(eq(leads.source, "Test CSV"));

    for (const lead of testLeads) {
      await db.insert(emailQueue).values({
        campaignId,
        leadId: lead.id,
        subject: "Test Subject",
        body: "Test Body",
        status: "pending",
      });
    }

    const queueItems = await db
      .select()
      .from(emailQueue)
      .where(eq(emailQueue.campaignId, campaignId));

    expect(queueItems.length).toBe(2);
    expect(queueItems[0].status).toBe("pending");
  });

  it("devrait vérifier la limite quotidienne de 500 emails", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sentToday = await db
      .select()
      .from(emailQueue)
      .where(eq(emailQueue.status, "sent"));

    const remainingQuota = 500 - sentToday.length;

    expect(remainingQuota).toBeGreaterThan(0);
    expect(remainingQuota).toBeLessThanOrEqual(500);
  });

  it("devrait calculer les statistiques de campagne", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const campaigns = await db.select().from(emailCampaigns).limit(1);
    const campaignId = campaigns[0].id;

    const queueItems = await db
      .select()
      .from(emailQueue)
      .where(eq(emailQueue.campaignId, campaignId));

    const stats = {
      total: queueItems.length,
      pending: queueItems.filter((q) => q.status === "pending").length,
      sent: queueItems.filter((q) => q.status === "sent").length,
      failed: queueItems.filter((q) => q.status === "failed").length,
    };

    expect(stats.total).toBe(2);
    expect(stats.pending).toBe(2);
  });
});
