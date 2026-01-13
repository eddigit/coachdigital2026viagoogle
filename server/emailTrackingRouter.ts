import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { emailTracking, emailBlacklist, emailQueue, leads } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

/**
 * Router pour le tracking des emails (ouvertures, clics) et la blacklist
 */
export const emailTrackingRouter = router({
  // Créer un tracking ID pour un email
  createTracking: protectedProcedure
    .input(
      z.object({
        emailQueueId: z.number(),
        leadId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Générer un tracking ID unique
      const trackingId = randomBytes(32).toString("hex");

      const result = await db.insert(emailTracking).values({
        emailQueueId: input.emailQueueId,
        leadId: input.leadId,
        trackingId,
      });

      return { trackingId };
    }),

  // Enregistrer une ouverture d'email (route publique)
  trackOpen: publicProcedure
    .input(
      z.object({
        trackingId: z.string(),
        userAgent: z.string().optional(),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Récupérer le tracking
      const trackingResult = await db
        .select()
        .from(emailTracking)
        .where(eq(emailTracking.trackingId, input.trackingId))
        .limit(1);

      if (trackingResult.length === 0) {
        return { success: false, error: "Tracking not found" };
      }

      const tracking = trackingResult[0];

      // Mettre à jour le tracking
      await db
        .update(emailTracking)
        .set({
          opened: true,
          openedAt: tracking.openedAt || new Date(),
          openCount: (tracking.openCount || 0) + 1,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
        })
        .where(eq(emailTracking.id, tracking.id));

      return { success: true };
    }),

  // Enregistrer un clic sur un lien (route publique)
  trackClick: publicProcedure
    .input(
      z.object({
        trackingId: z.string(),
        userAgent: z.string().optional(),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Récupérer le tracking
      const trackingResult = await db
        .select()
        .from(emailTracking)
        .where(eq(emailTracking.trackingId, input.trackingId))
        .limit(1);

      if (trackingResult.length === 0) {
        return { success: false, error: "Tracking not found" };
      }

      const tracking = trackingResult[0];

      // Mettre à jour le tracking
      await db
        .update(emailTracking)
        .set({
          clicked: true,
          clickedAt: tracking.clickedAt || new Date(),
          clickCount: (tracking.clickCount || 0) + 1,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
        })
        .where(eq(emailTracking.id, tracking.id));

      return { success: true };
    }),

  // Obtenir les statistiques d'une campagne
  getCampaignStats: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Récupérer tous les emails de la campagne
      const emails = await db
        .select()
        .from(emailQueue)
        .where(eq(emailQueue.campaignId, input.campaignId));

      // Récupérer les trackings
      const trackings = await db
        .select()
        .from(emailTracking)
        .where(
          eq(
            emailTracking.emailQueueId,
            emails.length > 0 ? emails[0].id : 0
          )
        );

      const stats = {
        totalSent: emails.filter((e) => e.status === "sent").length,
        totalOpened: trackings.filter((t) => t.opened).length,
        totalClicked: trackings.filter((t) => t.clicked).length,
        openRate: 0,
        clickRate: 0,
      };

      if (stats.totalSent > 0) {
        stats.openRate = (stats.totalOpened / stats.totalSent) * 100;
        stats.clickRate = (stats.totalClicked / stats.totalSent) * 100;
      }

      return stats;
    }),

  // Ajouter un email à la blacklist
  addToBlacklist: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await db.insert(emailBlacklist).values({
          email: input.email,
          reason: input.reason,
        });

        return { success: true };
      } catch (error) {
        // Email déjà dans la blacklist
        return { success: false, error: "Email already blacklisted" };
      }
    }),

  // Retirer un email de la blacklist
  removeFromBlacklist: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(emailBlacklist)
        .where(eq(emailBlacklist.email, input.email));

      return { success: true };
    }),

  // Lister les emails blacklistés
  listBlacklist: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(emailBlacklist)
      .orderBy(desc(emailBlacklist.createdAt));
  }),
  
  // Alias pour getBlacklist
  getBlacklist: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(emailBlacklist)
      .orderBy(desc(emailBlacklist.createdAt));
  }),

  // Vérifier si un email est blacklisté
  isBlacklisted: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(emailBlacklist)
        .where(eq(emailBlacklist.email, input.email))
        .limit(1);

      return result.length > 0;
    }),

  // Désabonnement public (pour les liens dans les emails)
  unsubscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Vérifier le token (simple hash de l'email pour la démo)
      const expectedToken = Buffer.from(input.email).toString("base64");
      if (input.token !== expectedToken) {
        return { success: false, error: "Invalid token" };
      }

      // Ajouter à la blacklist
      try {
        await db.insert(emailBlacklist).values({
          email: input.email,
          reason: "Unsubscribed via email link",
        });

        return { success: true };
      } catch (error) {
        // Déjà blacklisté
        return { success: true };
      }
    }),
});
