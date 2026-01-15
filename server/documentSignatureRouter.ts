import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { documentTracking, documentViews, documentSignatures, documents, clients } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendEmail } from "./emailService";

export const documentTrackingRouter = router({
  createTracking: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const trackingToken = randomBytes(32).toString("hex");

      const result = await db.insert(documentTracking).values({
        documentId: input.documentId,
        trackingToken,
      });

      return { 
        trackingId: Number(result[0].insertId), 
        trackingToken,
        viewUrl: `${process.env.VITE_APP_URL || "https://coachdigital.biz"}/view/${trackingToken}`,
      };
    }),

  getByDocument: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const tracking = await db
        .select()
        .from(documentTracking)
        .where(eq(documentTracking.documentId, input.documentId))
        .limit(1);

      return tracking[0] || null;
    }),

  getViews: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(documentViews)
        .where(eq(documentViews.documentId, input.documentId))
        .orderBy(desc(documentViews.viewedAt));
    }),

  recordView: publicProcedure
    .input(z.object({ 
      token: z.string(),
      userAgent: z.string().optional(),
      ipAddress: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const tracking = await db
        .select()
        .from(documentTracking)
        .where(eq(documentTracking.trackingToken, input.token))
        .limit(1);

      if (!tracking[0]) {
        throw new Error("Token invalide");
      }

      const now = new Date();
      const isFirstView = !tracking[0].firstViewedAt;

      await db.update(documentTracking)
        .set({
          viewCount: tracking[0].viewCount + 1,
          firstViewedAt: tracking[0].firstViewedAt || now,
          lastViewedAt: now,
          viewerIp: input.ipAddress,
          viewerUserAgent: input.userAgent,
        })
        .where(eq(documentTracking.id, tracking[0].id));

      await db.insert(documentViews).values({
        documentId: tracking[0].documentId,
        trackingId: tracking[0].id,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });

      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.id, tracking[0].documentId))
        .limit(1);

      if (isFirstView && doc[0]) {
        const client = await db
          .select()
          .from(clients)
          .where(eq(clients.id, doc[0].clientId))
          .limit(1);

        const docType = doc[0].type === "quote" ? "Devis" : "Facture";
        const clientName = client[0] ? `${client[0].firstName} ${client[0].lastName}` : "Client";

        try {
          await sendEmail({
            to: process.env.SMTP_USER || "coachdigitalparis@gmail.com",
            subject: `${docType} ${doc[0].number} ouvert par ${clientName}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #E67E50;">Document ouvert</h2>
                <p><strong>${clientName}</strong> vient d'ouvrir le ${docType.toLowerCase()} <strong>${doc[0].number}</strong>.</p>
                <p><strong>Date:</strong> ${now.toLocaleString("fr-FR")}</p>
                <p><strong>Montant:</strong> ${doc[0].totalTtc} €</p>
                <p style="margin-top: 20px;">
                  <a href="${process.env.VITE_APP_URL || "https://coachdigital.biz"}/documents" 
                     style="background-color: #E67E50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                    Voir le document
                  </a>
                </p>
              </div>
            `,
            text: `${clientName} vient d'ouvrir le ${docType.toLowerCase()} ${doc[0].number}.`,
          });
        } catch (e) {
          console.error("Erreur envoi notification ouverture:", e);
        }
      }

      return { success: true, documentId: tracking[0].documentId };
    }),

  getDocumentByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const tracking = await db
        .select()
        .from(documentTracking)
        .where(eq(documentTracking.trackingToken, input.token))
        .limit(1);

      if (!tracking[0]) return null;

      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.id, tracking[0].documentId))
        .limit(1);

      if (!doc[0]) return null;

      const client = await db
        .select()
        .from(clients)
        .where(eq(clients.id, doc[0].clientId))
        .limit(1);

      return {
        document: doc[0],
        client: client[0] || null,
        tracking: tracking[0],
      };
    }),

  getRecentViews: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const recentViews = await db
      .select({
        view: documentViews,
        tracking: documentTracking,
      })
      .from(documentViews)
      .innerJoin(documentTracking, eq(documentViews.trackingId, documentTracking.id))
      .orderBy(desc(documentViews.viewedAt))
      .limit(20);

    const results = [];
    for (const { view, tracking } of recentViews) {
      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.id, tracking.documentId))
        .limit(1);

      if (doc[0]) {
        const client = await db
          .select()
          .from(clients)
          .where(eq(clients.id, doc[0].clientId))
          .limit(1);

        results.push({
          ...view,
          document: doc[0],
          client: client[0] || null,
        });
      }
    }

    return results;
  }),
});

export const signatureRouter = router({
  create: protectedProcedure
    .input(z.object({
      documentId: z.number(),
      signerName: z.string(),
      signerEmail: z.string().email(),
      signerRole: z.enum(["client", "coach"]).default("client"),
      expiresInDays: z.number().default(7),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const signatureToken = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      const result = await db.insert(documentSignatures).values({
        documentId: input.documentId,
        signatureToken,
        signerName: input.signerName,
        signerEmail: input.signerEmail,
        signerRole: input.signerRole,
        expiresAt,
      });

      const signatureUrl = `${process.env.VITE_APP_URL || "https://coachdigital.biz"}/sign/${signatureToken}`;

      return {
        signatureId: Number(result[0].insertId),
        signatureToken,
        signatureUrl,
      };
    }),

  sendRequest: protectedProcedure
    .input(z.object({
      documentId: z.number(),
      signerName: z.string(),
      signerEmail: z.string().email(),
      message: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.id, input.documentId))
        .limit(1);

      if (!doc[0]) throw new Error("Document introuvable");

      const signatureToken = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.insert(documentSignatures).values({
        documentId: input.documentId,
        signatureToken,
        signerName: input.signerName,
        signerEmail: input.signerEmail,
        signerRole: "client",
        expiresAt,
      });

      const signatureUrl = `${process.env.VITE_APP_URL || "https://coachdigital.biz"}/sign/${signatureToken}`;
      const docType = doc[0].type === "quote" ? "devis" : "facture";

      await sendEmail({
        to: input.signerEmail,
        subject: `Signature requise - ${docType.charAt(0).toUpperCase() + docType.slice(1)} ${doc[0].number}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 50px; height: 50px; border: 2px solid #E67E50; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="color: #E67E50; font-weight: bold; font-size: 24px;">G</span>
              </div>
              <h1 style="color: #E67E50; margin-top: 10px;">Coach Digital</h1>
            </div>
            
            <p>Bonjour ${input.signerName},</p>
            
            <p>Vous avez reçu un ${docType} à signer de la part de Coach Digital.</p>
            
            ${input.message ? `<p style="background: #f5f5f5; padding: 15px; border-radius: 4px; font-style: italic;">${input.message}</p>` : ""}
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Document:</strong> ${docType.charAt(0).toUpperCase() + docType.slice(1)} ${doc[0].number}</p>
              <p><strong>Montant:</strong> ${doc[0].totalTtc} € TTC</p>
              <p><strong>Expire le:</strong> ${expiresAt.toLocaleDateString("fr-FR")}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signatureUrl}" 
                 style="background-color: #E67E50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                Consulter et signer le document
              </a>
            </div>
            
            <p style="color: #666; font-size: 12px;">
              Ce lien expire dans 7 jours. Si vous avez des questions, contactez-nous à coachdigitalparis@gmail.com.
            </p>
          </div>
        `,
        text: `Bonjour ${input.signerName}, vous avez reçu un ${docType} à signer. Consultez-le ici: ${signatureUrl}`,
      });

      return { success: true, signatureUrl };
    }),

  getByDocument: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(documentSignatures)
        .where(eq(documentSignatures.documentId, input.documentId))
        .orderBy(desc(documentSignatures.createdAt));
    }),

  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const signature = await db
        .select()
        .from(documentSignatures)
        .where(eq(documentSignatures.signatureToken, input.token))
        .limit(1);

      if (!signature[0]) return null;

      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.id, signature[0].documentId))
        .limit(1);

      const client = doc[0] ? await db
        .select()
        .from(clients)
        .where(eq(clients.id, doc[0].clientId))
        .limit(1) : [];

      return {
        signature: signature[0],
        document: doc[0] || null,
        client: client[0] || null,
      };
    }),

  sign: publicProcedure
    .input(z.object({
      token: z.string(),
      signatureData: z.string(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const signature = await db
        .select()
        .from(documentSignatures)
        .where(eq(documentSignatures.signatureToken, input.token))
        .limit(1);

      if (!signature[0]) throw new Error("Token invalide");
      if (signature[0].status === "signed") throw new Error("Document déjà signé");
      if (signature[0].expiresAt && new Date(signature[0].expiresAt) < new Date()) {
        throw new Error("Le lien de signature a expiré");
      }

      const now = new Date();

      await db.update(documentSignatures)
        .set({
          status: "signed",
          signatureData: input.signatureData,
          signedAt: now,
          signedIp: input.ipAddress,
          signedUserAgent: input.userAgent,
        })
        .where(eq(documentSignatures.id, signature[0].id));

      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.id, signature[0].documentId))
        .limit(1);

      if (doc[0] && doc[0].type === "quote") {
        await db.update(documents)
          .set({ status: "accepted" })
          .where(eq(documents.id, doc[0].id));
      }

      if (doc[0]) {
        const docType = doc[0].type === "quote" ? "Devis" : "Facture";
        try {
          await sendEmail({
            to: process.env.SMTP_USER || "coachdigitalparis@gmail.com",
            subject: `${docType} ${doc[0].number} signé par ${signature[0].signerName}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #22c55e;">Document signé</h2>
                <p><strong>${signature[0].signerName}</strong> a signé le ${docType.toLowerCase()} <strong>${doc[0].number}</strong>.</p>
                <p><strong>Date:</strong> ${now.toLocaleString("fr-FR")}</p>
                <p><strong>Email:</strong> ${signature[0].signerEmail}</p>
                <p><strong>Montant:</strong> ${doc[0].totalTtc} €</p>
                <p style="margin-top: 20px;">
                  <a href="${process.env.VITE_APP_URL || "https://coachdigital.biz"}/documents" 
                     style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                    Voir le document
                  </a>
                </p>
              </div>
            `,
            text: `${signature[0].signerName} a signé le ${docType.toLowerCase()} ${doc[0].number}.`,
          });
        } catch (e) {
          console.error("Erreur notification signature:", e);
        }
      }

      return { success: true };
    }),

  decline: publicProcedure
    .input(z.object({
      token: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const signature = await db
        .select()
        .from(documentSignatures)
        .where(eq(documentSignatures.signatureToken, input.token))
        .limit(1);

      if (!signature[0]) throw new Error("Token invalide");
      if (signature[0].status !== "pending") throw new Error("Action non autorisée");

      await db.update(documentSignatures)
        .set({
          status: "declined",
          declinedReason: input.reason,
        })
        .where(eq(documentSignatures.id, signature[0].id));

      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.id, signature[0].documentId))
        .limit(1);

      if (doc[0] && doc[0].type === "quote") {
        await db.update(documents)
          .set({ status: "rejected" })
          .where(eq(documents.id, doc[0].id));
      }

      if (doc[0]) {
        const docType = doc[0].type === "quote" ? "Devis" : "Facture";
        try {
          await sendEmail({
            to: process.env.SMTP_USER || "coachdigitalparis@gmail.com",
            subject: `${docType} ${doc[0].number} refusé par ${signature[0].signerName}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #ef4444;">Document refusé</h2>
                <p><strong>${signature[0].signerName}</strong> a refusé le ${docType.toLowerCase()} <strong>${doc[0].number}</strong>.</p>
                ${input.reason ? `<p><strong>Raison:</strong> ${input.reason}</p>` : ""}
                <p style="margin-top: 20px;">
                  <a href="${process.env.VITE_APP_URL || "https://coachdigital.biz"}/documents" 
                     style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                    Voir le document
                  </a>
                </p>
              </div>
            `,
            text: `${signature[0].signerName} a refusé le ${docType.toLowerCase()} ${doc[0].number}. ${input.reason ? `Raison: ${input.reason}` : ""}`,
          });
        } catch (e) {
          console.error("Erreur notification refus:", e);
        }
      }

      return { success: true };
    }),

  sendReminder: protectedProcedure
    .input(z.object({ signatureId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const signature = await db
        .select()
        .from(documentSignatures)
        .where(eq(documentSignatures.id, input.signatureId))
        .limit(1);

      if (!signature[0]) throw new Error("Signature introuvable");
      if (signature[0].status !== "pending") throw new Error("Document déjà traité");

      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.id, signature[0].documentId))
        .limit(1);

      if (!doc[0]) throw new Error("Document introuvable");

      const signatureUrl = `${process.env.VITE_APP_URL || "https://coachdigital.biz"}/sign/${signature[0].signatureToken}`;
      const docType = doc[0].type === "quote" ? "devis" : "facture";

      await sendEmail({
        to: signature[0].signerEmail,
        subject: `Rappel: Signature requise - ${docType.charAt(0).toUpperCase() + docType.slice(1)} ${doc[0].number}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #E67E50;">Rappel de signature</h2>
            <p>Bonjour ${signature[0].signerName},</p>
            <p>Nous vous rappelons qu'un ${docType} est en attente de votre signature.</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Document:</strong> ${doc[0].number}</p>
              <p><strong>Montant:</strong> ${doc[0].totalTtc} € TTC</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signatureUrl}" 
                 style="background-color: #E67E50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Signer maintenant
              </a>
            </div>
          </div>
        `,
        text: `Rappel: Un ${docType} est en attente de votre signature. Signez ici: ${signatureUrl}`,
      });

      await db.update(documentSignatures)
        .set({
          reminderSentAt: new Date(),
          reminderCount: signature[0].reminderCount + 1,
        })
        .where(eq(documentSignatures.id, signature[0].id));

      return { success: true };
    }),

  getPendingSignatures: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const pending = await db
      .select()
      .from(documentSignatures)
      .where(eq(documentSignatures.status, "pending"))
      .orderBy(desc(documentSignatures.createdAt));

    const results = [];
    for (const sig of pending) {
      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.id, sig.documentId))
        .limit(1);

      if (doc[0]) {
        const client = await db
          .select()
          .from(clients)
          .where(eq(clients.id, doc[0].clientId))
          .limit(1);

        results.push({
          ...sig,
          document: doc[0],
          client: client[0] || null,
        });
      }
    }

    return results;
  }),
});
