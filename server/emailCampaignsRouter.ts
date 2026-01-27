import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { db as firestore } from "./firestore";
import { EmailCampaign, EmailQueueItem } from "./schema";
import { sendEmail } from "./emailService";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

export const emailCampaignsRouter = router({
  // Lister toutes les campagnes avec statistiques
  list: protectedProcedure.query(async ({ ctx }) => {
    const snapshot = await firestore.collection('emailCampaigns')
      .orderBy('createdAt', 'desc')
      .get();

    const campaigns = snapshot.docs.map(doc => mapDoc<EmailCampaign>(doc));

    // Pour chaque campagne, compter les emails par statut
    const campaignsWithStats = await Promise.all(
      campaigns.map(async (campaign) => {
        const queueSnapshot = await firestore.collection('emailQueue')
          .where('campaignId', '==', campaign.id)
          .get();
        const queue = queueSnapshot.docs.map(doc => mapDoc<EmailQueueItem>(doc));

        const sentCount = queue.filter(q => q.status === "sent").length;
        const failedCount = queue.filter(q => q.status === "failed").length;
        const pendingCount = queue.filter(q => q.status === "pending" || q.status === "sending").length;

        return {
          ...campaign,
          sentCount,
          failedCount,
          pendingCount,
        };
      })
    );

    return campaignsWithStats;
  }),

  // Relancer les emails échoués d'une campagne
  retryFailed: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Récupérer tous les emails échoués de la campagne
      const snapshot = await firestore.collection('emailQueue')
        .where('campaignId', '==', input.campaignId)
        .where('status', '==', 'failed')
        .get();

      const failedEmails = snapshot.docs.map(doc => mapDoc<EmailQueueItem>(doc));

      if (failedEmails.length === 0) {
        throw new Error("Aucun email échoué à relancer");
      }

      // Relancer chaque email
      let successCount = 0;
      for (const email of failedEmails) {
        try {
          // Send email logic (requires lead contact info which is usually in email queue body/subject OR need to fetch lead)
          // The previous code did: db.select().from(emailQueue)... Wait, it selected from `emailQueue` where id=... and called it `lead`?
          // Line 83 in original: const lead = await db.select().from(emailQueue)...
          // It seems it was reusing the email queue item itself?
          // Previous code:
          // lead = ... where id = email.id
          // sendEmail(to: lead[0].subject, ...) what?
          // ah, line 92 in original: `to: lead[0].subject`? That seems weird. Subject field holding the email?
          // Or maybe `lead[0]` was actually joining `leads`? No, `.from(emailQueue)`.
          // Maybe it was a bug in original code or I misread.
          // In `schema.ts`, `EmailQueueItem` has `subject` and `body`. It doesn't have `to` email address explicitly, maybe linked to `leadId`.
          // I should fetch the Lead to get the email!

          const leadDoc = await firestore.collection('leads').doc(String(email.leadId)).get();
          if (!leadDoc.exists) continue; // Lead missing
          const leadData = leadDoc.data();
          const toEmail = leadData?.email;

          if (!toEmail) continue;

          await sendEmail({
            to: toEmail,
            subject: email.subject,
            html: email.body,
          });

          // Mettre à jour le statut
          await firestore.collection('emailQueue').doc(String(email.id)).update({
            status: "sent",
            sentAt: new Date()
          });

          successCount++;
        } catch (error) {
          console.error(`Erreur lors de la relance de l'email ${email.id}:`, error);
          // Garder le statut "failed"
        }

        // Délai de 1 seconde
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return {
        total: failedEmails.length,
        success: successCount,
        failed: failedEmails.length - successCount,
      };
    }),
});
