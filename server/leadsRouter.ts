import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { leads, leadEmails, emailTemplates, clients, emailCampaigns, emailQueue, emailTracking, emailBlacklist } from "../drizzle/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { sendEmail } from "./emailService";
import { randomBytes } from "crypto";

/**
 * Router pour la gestion des leads et de la prospection
 */
export const leadsRouter = router({
  // Récupérer les leads en retard de relance
  getOverdueFollowUps: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueLeads = await db
      .select()
      .from(leads)
      .where(sql`${leads.nextFollowUpDate} IS NOT NULL AND ${leads.nextFollowUpDate} < ${today}`);

    return overdueLeads;
  }),

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

      // Vérifier la blacklist
      const blacklistResult = await db
        .select()
        .from(emailBlacklist)
        .where(eq(emailBlacklist.email, lead.email))
        .limit(1);

      if (blacklistResult.length > 0) {
        throw new Error("Email is blacklisted");
      }

      // Remplacer les variables dans le sujet et le corps
      const subject = input.subject.replace(/\{\{firstName\}\}/g, lead.firstName);
      let body = input.body.replace(/\{\{firstName\}\}/g, lead.firstName);

      // Créer un tracking ID
      const trackingId = randomBytes(32).toString('hex');
      const unsubscribeToken = Buffer.from(lead.email).toString('base64');
      const baseUrl = process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000';

      // Ajouter le pixel de tracking et le lien de désabonnement
      const trackingPixel = `<img src="${baseUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:none;" />`;
      const unsubscribeLink = `<p style="font-size: 11px; color: #999; margin-top: 40px; text-align: center;"><a href="${baseUrl}/unsubscribe/${encodeURIComponent(lead.email)}/${unsubscribeToken}" style="color: #999;">Se désabonner</a></p>`;

      // Wrapper les URLs avec le tracking de clics
      body = body.replace(/href="([^"]+)"/g, (match, url) => {
        return `href="${baseUrl}/api/track/click/${trackingId}?url=${encodeURIComponent(url)}"`;
      });

      const htmlBody = `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${body}</div>${trackingPixel}${unsubscribeLink}`;

      // Envoyer l'email
      const sent = await sendEmail({
        to: lead.email,
        subject,
        html: htmlBody,
        text: body,
      });

      if (!sent) {
        throw new Error("Failed to send email");
      }

      // Enregistrer dans l'historique
      const emailHistoryResult = await db.insert(leadEmails).values({
        leadId: input.leadId,
        templateId: input.templateId || null,
        subject,
        body,
        sentBy: ctx.user.id,
        status: "sent",
      });

      const emailQueueId = typeof emailHistoryResult === 'object' && 'insertId' in emailHistoryResult ? emailHistoryResult.insertId : emailHistoryResult[0];

      // Créer le tracking
      await db.insert(emailTracking).values({
        emailQueueId: emailQueueId as number,
        leadId: input.leadId,
        trackingId,
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

  // Importer des leads depuis un CSV
  importFromCSV: protectedProcedure
    .input(
      z.object({
        leads: z.array(
          z.object({
            firstName: z.string(),
            lastName: z.string(),
            email: z.string().email().optional(),
            phone: z.string().optional(),
            company: z.string().optional(),
            position: z.string().optional(),
            status: z.enum(["suspect", "analyse", "negociation", "conclusion"]).default("suspect"),
            potentialAmount: z.number().optional(),
            probability: z.number().min(0).max(100).default(25),
            source: z.string().optional(),
            notes: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = {
        total: input.leads.length,
        imported: 0,
        duplicates: 0,
        errors: 0,
        errorDetails: [] as string[],
      };

      for (const leadData of input.leads) {
        try {
          // Vérifier les doublons par email
          if (leadData.email) {
            const existing = await db
              .select()
              .from(leads)
              .where(eq(leads.email, leadData.email))
              .limit(1);

            if (existing.length > 0) {
              results.duplicates++;
              continue;
            }
          }

          // Insérer le lead
          await db.insert(leads).values({
            firstName: leadData.firstName,
            lastName: leadData.lastName,
            email: leadData.email,
            phone: leadData.phone,
            company: leadData.company,
            position: leadData.position,
            status: leadData.status,
            potentialAmount: leadData.potentialAmount?.toString(),
            probability: leadData.probability,
            source: leadData.source,
            notes: leadData.notes,
          });

          results.imported++;
        } catch (error) {
          results.errors++;
          results.errorDetails.push(`${leadData.firstName} ${leadData.lastName}: ${error}`);
        }
      }

      return results;
    }),

  // Créer une campagne d'envoi de masse
  createBulkCampaign: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        templateId: z.number().optional(),
        subject: z.string(),
        body: z.string(),
        leadIds: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Vérifier la limite quotidienne (500 emails/jour pour Gmail)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sentToday = await db
        .select()
        .from(emailQueue)
        .where(and(eq(emailQueue.status, "sent"), gte(emailQueue.sentAt, today)));

      const remainingQuota = 500 - sentToday.length;

      if (remainingQuota <= 0) {
        throw new Error("Limite quotidienne d'envoi atteinte (500 emails/jour)");
      }

      // Créer la campagne
      const campaignResult = await db.insert(emailCampaigns).values({
        name: input.name,
        templateId: input.templateId,
        subject: input.subject,
        body: input.body,
        status: "draft",
        totalRecipients: Math.min(input.leadIds.length, remainingQuota),
        createdBy: ctx.user.id,
      });

      const campaignId = typeof campaignResult === 'object' && 'insertId' in campaignResult ? campaignResult.insertId : campaignResult[0];

      // Ajouter les emails à la file d'attente (limité au quota restant)
      const leadsToSend = input.leadIds.slice(0, remainingQuota);

      for (const leadId of leadsToSend) {
        const leadResult = await db
          .select()
          .from(leads)
          .where(eq(leads.id, leadId))
          .limit(1);

        if (leadResult.length === 0 || !leadResult[0].email) continue;

        const lead = leadResult[0];

        // Remplacer les variables
        const subject = input.subject.replace(/\{\{firstName\}\}/g, lead.firstName);
        const body = input.body.replace(/\{\{firstName\}\}/g, lead.firstName);

        await db.insert(emailQueue).values({
          campaignId: campaignId as number,
          leadId,
          subject,
          body,
          status: "pending",
        });
      }

      return { campaignId, totalQueued: leadsToSend.length, remainingQuota };
    }),

  // Lancer l'envoi d'une campagne
  sendCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Mettre à jour le statut de la campagne
      await db
        .update(emailCampaigns)
        .set({ status: "sending" })
        .where(eq(emailCampaigns.id, input.campaignId));

      // Récupérer les emails en attente
      const pendingEmails = await db
        .select()
        .from(emailQueue)
        .where(and(eq(emailQueue.campaignId, input.campaignId), eq(emailQueue.status, "pending")));

      let sentCount = 0;
      let failedCount = 0;

      // Envoyer les emails
      for (const queueItem of pendingEmails) {
        try {
          // Mettre à jour le statut à "sending"
          await db
            .update(emailQueue)
            .set({ status: "sending" })
            .where(eq(emailQueue.id, queueItem.id));

          // Récupérer le lead
          const leadResult = await db
            .select()
            .from(leads)
            .where(eq(leads.id, queueItem.leadId))
            .limit(1);

          if (leadResult.length === 0 || !leadResult[0].email) {
            throw new Error("Lead not found or no email");
          }

          const lead = leadResult[0];

          // Envoyer l'email
          const sent = await sendEmail({
            to: lead.email!,
            subject: queueItem.subject,
            html: `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${queueItem.body}</div>`,
            text: queueItem.body,
          });

          if (sent) {
            // Mettre à jour le statut à "sent"
            await db
              .update(emailQueue)
              .set({ status: "sent", sentAt: new Date() })
              .where(eq(emailQueue.id, queueItem.id));

            // Enregistrer dans l'historique
            await db.insert(leadEmails).values({
              leadId: queueItem.leadId,
              subject: queueItem.subject,
              body: queueItem.body,
              sentBy: ctx.user.id,
              status: "sent",
            });

            // Mettre à jour la date de dernier contact
            await db
              .update(leads)
              .set({ lastContactDate: new Date() })
              .where(eq(leads.id, queueItem.leadId));

            sentCount++;
          } else {
            throw new Error("Failed to send email");
          }
        } catch (error) {
          // Mettre à jour le statut à "failed"
          await db
            .update(emailQueue)
            .set({ status: "failed", errorMessage: String(error) })
            .where(eq(emailQueue.id, queueItem.id));

          failedCount++;
        }

        // Petit délai entre les envois pour éviter le rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Mettre à jour la campagne
      await db
        .update(emailCampaigns)
        .set({
          status: "completed",
          sentCount,
          failedCount,
          completedAt: new Date(),
        })
        .where(eq(emailCampaigns.id, input.campaignId));

      return { sentCount, failedCount };
    }),

  // Obtenir les campagnes
  getCampaigns: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(emailCampaigns)
      .orderBy(desc(emailCampaigns.createdAt));
  }),

  // Obtenir les détails d'une campagne
  getCampaignDetails: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const campaign = await db
        .select()
        .from(emailCampaigns)
        .where(eq(emailCampaigns.id, input.campaignId))
        .limit(1);

      const queueItems = await db
        .select()
        .from(emailQueue)
        .where(eq(emailQueue.campaignId, input.campaignId))
        .orderBy(emailQueue.status, desc(emailQueue.createdAt));

      return {
        campaign: campaign[0] || null,
        queueItems,
      };
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
  
  // Calculer le score d'engagement d'un lead
  calculateLeadScore: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Récupérer tous les trackings du lead
      const trackings = await db
        .select()
        .from(emailTracking)
        .where(eq(emailTracking.leadId, input.leadId));
      
      if (trackings.length === 0) {
        // Aucun email envoyé, score = 0
        await db
          .update(leads)
          .set({ score: 0 })
          .where(eq(leads.id, input.leadId));
        return { score: 0 };
      }
      
      // Calculer le score basé sur l'engagement
      // Pondération: ouvertures (30%), clics (40%), réponses (30%)
      const totalEmails = trackings.length;
      const openedEmails = trackings.filter(t => t.opened).length;
      const clickedEmails = trackings.filter(t => t.clicked).length;
      
      const openRate = (openedEmails / totalEmails) * 100;
      const clickRate = (clickedEmails / totalEmails) * 100;
      
      // Score = (openRate * 0.3) + (clickRate * 0.4) + (réponses * 0.3)
      // Pour l'instant, réponses = 0 (non implémenté)
      const score = Math.round((openRate * 0.3) + (clickRate * 0.4));
      
      // Mettre à jour le score dans la base
      await db
        .update(leads)
        .set({ score })
        .where(eq(leads.id, input.leadId));
      
      return { score };
    }),
  
  // Recalculer tous les scores
  recalculateAllScores: protectedProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const allLeads = await db.select().from(leads);
      let updated = 0;
      
      for (const lead of allLeads) {
        // Récupérer tous les trackings du lead
        const trackings = await db
          .select()
          .from(emailTracking)
          .where(eq(emailTracking.leadId, lead.id));
        
        if (trackings.length === 0) {
          await db
            .update(leads)
            .set({ score: 0 })
            .where(eq(leads.id, lead.id));
          continue;
        }
        
        const totalEmails = trackings.length;
        const openedEmails = trackings.filter(t => t.opened).length;
        const clickedEmails = trackings.filter(t => t.clicked).length;
        
        const openRate = (openedEmails / totalEmails) * 100;
        const clickRate = (clickedEmails / totalEmails) * 100;
        
        const score = Math.round((openRate * 0.3) + (clickRate * 0.4));
        
        await db
          .update(leads)
          .set({ score })
          .where(eq(leads.id, lead.id));
        
        updated++;
      }
      
      return { updated };
    }),
});
