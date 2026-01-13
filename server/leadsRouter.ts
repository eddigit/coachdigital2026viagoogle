import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { leads, leadEmails, emailTemplates, clients } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { sendEmail } from "./emailService";

/**
 * Router pour la gestion des leads et de la prospection
 */
export const leadsRouter = router({
  // Lister tous les leads
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(leads)
      .orderBy(desc(leads.createdAt));
  }),

  // Lister les leads par statut
  listByStatus: protectedProcedure
    .input(
      z.object({
        status: z.enum(["suspect", "analyse", "negociation", "conclusion"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select()
        .from(leads)
        .where(eq(leads.status, input.status))
        .orderBy(desc(leads.createdAt));
    }),

  // Obtenir un lead par ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(leads)
        .where(eq(leads.id, input.id))
        .limit(1);

      return result[0] || null;
    }),

  // Créer un lead
  create: protectedProcedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        country: z.string().default("France"),
        status: z.enum(["suspect", "analyse", "negociation", "conclusion"]).default("suspect"),
        potentialAmount: z.number().optional(),
        probability: z.number().min(0).max(100).default(25),
        source: z.string().optional(),
        notes: z.string().optional(),
        lastContactDate: z.string().optional(),
        nextFollowUpDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(leads).values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        company: input.company,
        position: input.position,
        address: input.address,
        postalCode: input.postalCode,
        city: input.city,
        country: input.country,
        status: input.status,
        potentialAmount: input.potentialAmount?.toString(),
        probability: input.probability,
        source: input.source,
        notes: input.notes,
        lastContactDate: input.lastContactDate ? new Date(input.lastContactDate) : null,
        nextFollowUpDate: input.nextFollowUpDate ? new Date(input.nextFollowUpDate) : null,
      });
      
      const leadId = typeof result === 'object' && 'insertId' in result ? result.insertId : result[0];

      return { success: true, leadId };
    }),

  // Mettre à jour un lead
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        status: z.enum(["suspect", "analyse", "negociation", "conclusion"]).optional(),
        potentialAmount: z.number().optional(),
        probability: z.number().min(0).max(100).optional(),
        source: z.string().optional(),
        notes: z.string().optional(),
        lastContactDate: z.string().optional(),
        nextFollowUpDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      const dataToUpdate: any = {
        ...updateData,
        potentialAmount: updateData.potentialAmount?.toString(),
      };

      if (updateData.lastContactDate) {
        dataToUpdate.lastContactDate = new Date(updateData.lastContactDate);
      }
      if (updateData.nextFollowUpDate) {
        dataToUpdate.nextFollowUpDate = new Date(updateData.nextFollowUpDate);
      }

      await db
        .update(leads)
        .set(dataToUpdate)
        .where(eq(leads.id, id));

      return { success: true };
    }),

  // Changer le statut d'un lead
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["suspect", "analyse", "negociation", "conclusion"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(leads)
        .set({ status: input.status })
        .where(eq(leads.id, input.id));

      return { success: true };
    }),

  // Convertir un lead en client
  convertToClient: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Récupérer le lead
      const leadResult = await db
        .select()
        .from(leads)
        .where(eq(leads.id, input.leadId))
        .limit(1);

      if (leadResult.length === 0) {
        throw new Error("Lead not found");
      }

      const lead = leadResult[0];

      // Créer le client
      const clientResult = await db.insert(clients).values({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        company: lead.company || undefined,
        position: lead.position || undefined,
        address: lead.address || undefined,
        postalCode: lead.postalCode || undefined,
        city: lead.city || undefined,
        country: lead.country || "France",
        category: "active",
        status: "active",
        notes: lead.notes || undefined,
        avatarUrl: lead.avatarUrl || undefined,
      });

      const clientId = typeof clientResult === 'object' && 'insertId' in clientResult ? clientResult.insertId : clientResult[0];

      // Mettre à jour le lead avec la conversion
      await db
        .update(leads)
        .set({
          convertedToClientId: clientId as number,
          convertedAt: new Date(),
        })
        .where(eq(leads.id, input.leadId));

      return { success: true, clientId };
    }),

  // Supprimer un lead
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(leads).where(eq(leads.id, input.id));

      return { success: true };
    }),

  // Envoyer un email à un lead
  sendEmail: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        templateId: z.number().optional(),
        subject: z.string(),
        body: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Récupérer le lead
      const leadResult = await db
        .select()
        .from(leads)
        .where(eq(leads.id, input.leadId))
        .limit(1);

      if (leadResult.length === 0) {
        throw new Error("Lead not found");
      }

      const lead = leadResult[0];

      if (!lead.email) {
        throw new Error("Lead has no email address");
      }

      // Remplacer les variables dans le sujet et le corps
      const subject = input.subject.replace(/\{\{firstName\}\}/g, lead.firstName);
      const body = input.body.replace(/\{\{firstName\}\}/g, lead.firstName);

      // Envoyer l'email
      const sent = await sendEmail({
        to: lead.email,
        subject,
        html: `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${body}</div>`,
        text: body,
      });

      if (!sent) {
        throw new Error("Failed to send email");
      }

      // Enregistrer dans l'historique
      await db.insert(leadEmails).values({
        leadId: input.leadId,
        templateId: input.templateId || null,
        subject,
        body,
        sentBy: ctx.user.id,
        status: "sent",
      });

      // Mettre à jour la date de dernier contact
      const today = new Date();
      await db
        .update(leads)
        .set({ lastContactDate: today })
        .where(eq(leads.id, input.leadId));

      return { success: true };
    }),

  // Obtenir l'historique des emails d'un lead
  getEmailHistory: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select()
        .from(leadEmails)
        .where(eq(leadEmails.leadId, input.leadId))
        .orderBy(desc(leadEmails.sentAt));
    }),

  // Obtenir les statistiques du pipeline
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allLeads = await db.select().from(leads);

    const stats = {
      total: allLeads.length,
      suspect: allLeads.filter((l) => l.status === "suspect").length,
      analyse: allLeads.filter((l) => l.status === "analyse").length,
      negociation: allLeads.filter((l) => l.status === "negociation").length,
      conclusion: allLeads.filter((l) => l.status === "conclusion").length,
      converted: allLeads.filter((l) => l.convertedToClientId).length,
      totalPotential: allLeads.reduce((sum, l) => sum + parseFloat(l.potentialAmount || "0"), 0),
      weightedPotential: allLeads.reduce(
        (sum, l) => sum + parseFloat(l.potentialAmount || "0") * (l.probability || 0) / 100,
        0
      ),
    };

    return stats;
  }),
});

// Router pour les templates d'emails
export const emailTemplatesRouter = router({
  // Lister tous les templates actifs
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.isActive, true))
      .orderBy(emailTemplates.category, emailTemplates.name);
  }),

  // Obtenir un template par ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, input.id))
        .limit(1);

      return result[0] || null;
    }),
});
