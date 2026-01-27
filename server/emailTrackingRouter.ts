import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getNextId } from "./db";
import { db as firestore } from "./firestore";
import { EmailTracking, EmailQueueItem, EmailBlacklist } from "./schema";
import { randomBytes } from "crypto";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

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
      // Générer un tracking ID unique
      const trackingId = randomBytes(32).toString("hex");

      const id = await getNextId('emailTracking');
      await firestore.collection('emailTracking').doc(String(id)).set({
        id,
        emailQueueId: input.emailQueueId,
        leadId: input.leadId,
        trackingId,
        opened: false,
        clicked: false,
        openCount: 0,
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
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
      const snapshot = await firestore.collection('emailTracking')
        .where('trackingId', '==', input.trackingId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return { success: false, error: "Tracking not found" };
      }

      const doc = snapshot.docs[0];
      const tracking = doc.data();

      // Mettre à jour le tracking
      await doc.ref.update({
        opened: true,
        openedAt: tracking.openedAt || new Date(),
        openCount: (tracking.openCount || 0) + 1,
        userAgent: input.userAgent || tracking.userAgent || null,
        ipAddress: input.ipAddress || tracking.ipAddress || null,
        updatedAt: new Date()
      });

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
      const snapshot = await firestore.collection('emailTracking')
        .where('trackingId', '==', input.trackingId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return { success: false, error: "Tracking not found" };
      }

      const doc = snapshot.docs[0];
      const tracking = doc.data();

      // Mettre à jour le tracking
      await doc.ref.update({
        clicked: true,
        clickedAt: tracking.clickedAt || new Date(),
        clickCount: (tracking.clickCount || 0) + 1,
        userAgent: input.userAgent || tracking.userAgent || null,
        ipAddress: input.ipAddress || tracking.ipAddress || null,
        updatedAt: new Date()
      });

      return { success: true };
    }),

  // Obtenir les statistiques d'une campagne
  getCampaignStats: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      // Récupérer tous les emails de la campagne
      const emailsSnapshot = await firestore.collection('emailQueue')
        .where('campaignId', '==', input.campaignId)
        .get();

      const emails = emailsSnapshot.docs.map(doc => mapDoc<EmailQueueItem>(doc));

      const emailIds = emails.map(e => e.id);

      let trackings: EmailTracking[] = [];
      if (emailIds.length > 0) {
        // Process in batches of 10 for 'in' query, or just fetch all trackings and filter?
        // If expecting many events, fetch per email might be slow.
        // Better: If we added campaignId to tracking, it would be fast.
        // Assuming we didn't add it yet.
        // Fallback: Loop and fetch. Parallelized.

        const promises = emailIds.map(id =>
          firestore.collection('emailTracking')
            .where('emailQueueId', '==', id)
            .get()
        );

        const results = await Promise.all(promises);
        results.forEach(snap => {
          snap.docs.forEach(d => trackings.push(mapDoc<EmailTracking>(d)));
        });
      }

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
      // Check duplicate
      const existSnap = await firestore.collection('emailBlacklist')
        .where('email', '==', input.email)
        .get();
      if (!existSnap.empty) {
        return { success: false, error: "Email already blacklisted" };
      }

      const id = await getNextId('emailBlacklist');
      await firestore.collection('emailBlacklist').doc(String(id)).set({
        id,
        email: input.email,
        reason: input.reason || null,
        createdAt: new Date()
      });

      return { success: true };
    }),

  // Retirer un email de la blacklist
  removeFromBlacklist: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const snapshot = await firestore.collection('emailBlacklist')
        .where('email', '==', input.email)
        .get();

      const batch = firestore.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      return { success: true };
    }),

  // Lister les emails blacklistés
  listBlacklist: protectedProcedure.query(async () => {
    const snapshot = await firestore.collection('emailBlacklist')
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => mapDoc<EmailBlacklist>(doc));
  }),

  // Alias pour getBlacklist
  getBlacklist: protectedProcedure.query(async () => {
    const snapshot = await firestore.collection('emailBlacklist')
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => mapDoc<EmailBlacklist>(doc));
  }),

  // Vérifier si un email est blacklisté
  isBlacklisted: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const snapshot = await firestore.collection('emailBlacklist')
        .where('email', '==', input.email)
        .limit(1)
        .get();

      return !snapshot.empty;
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
      // Vérifier le token (simple hash de l'email pour la démo)
      const expectedToken = Buffer.from(input.email).toString("base64");
      if (input.token !== expectedToken) {
        return { success: false, error: "Invalid token" };
      }

      // Ajouter à la blacklist
      try {
        const id = await getNextId('emailBlacklist');
        await firestore.collection('emailBlacklist').doc(String(id)).set({
          id,
          email: input.email,
          reason: "Unsubscribed via email link",
          createdAt: new Date()
        });

        return { success: true };
      } catch (error) {
        // Déjà blacklisté
        console.warn("Unsubscribe duplicate warning", error);
        return { success: true };
      }
    }),
});
