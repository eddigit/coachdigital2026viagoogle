import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getNextId } from "./db";
import { db as firestore } from "./firestore";
import { DocumentTracking, DocumentView, DocumentSignature, ClientDocument, Client } from "./schema";
import { randomBytes } from "crypto";
import { sendEmail } from "./emailService";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

export const documentTrackingRouter = router({
  createTracking: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ input }) => {
      const trackingToken = randomBytes(32).toString("hex");
      const id = await getNextId('documentTracking');

      await firestore.collection('documentTracking').doc(String(id)).set({
        id,
        documentId: input.documentId,
        trackingToken,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return {
        trackingId: id,
        trackingToken,
        viewUrl: `${process.env.VITE_APP_URL || "https://coachdigital.biz"}/view/${trackingToken}`,
      };
    }),

  getByDocument: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const snapshot = await firestore.collection('documentTracking')
        .where('documentId', '==', input.documentId)
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      return mapDoc<DocumentTracking>(snapshot.docs[0]);
    }),

  getViews: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const snapshot = await firestore.collection('documentViews')
        .where('documentId', '==', input.documentId)
        .orderBy('viewedAt', 'desc')
        .get();
      return snapshot.docs.map(doc => mapDoc<DocumentView>(doc));
    }),

  recordView: publicProcedure
    .input(z.object({
      token: z.string(),
      userAgent: z.string().optional(),
      ipAddress: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const trackSnap = await firestore.collection('documentTracking')
        .where('trackingToken', '==', input.token)
        .limit(1)
        .get();

      if (trackSnap.empty) {
        throw new Error("Token invalide");
      }

      const trackingDoc = trackSnap.docs[0];
      const tracking = mapDoc<DocumentTracking>(trackingDoc);
      const now = new Date();
      const isFirstView = !tracking.firstViewedAt;

      await trackingDoc.ref.update({
        viewCount: (tracking.viewCount || 0) + 1,
        firstViewedAt: tracking.firstViewedAt || now,
        lastViewedAt: now,
        viewerIp: input.ipAddress || null,
        viewerUserAgent: input.userAgent || null,
        updatedAt: now
      });

      const viewId = await getNextId('documentViews');
      await firestore.collection('documentViews').doc(String(viewId)).set({
        id: viewId,
        documentId: tracking.documentId,
        trackingId: tracking.id,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        viewedAt: now
      });

      if (isFirstView) {
        const docSnap = await firestore.collection('documents').doc(String(tracking.documentId)).get();
        if (docSnap.exists) {
          const doc = mapDoc<ClientDocument>(docSnap);

          let clientName = "Client";
          if (doc.clientId) {
            const clientSnap = await firestore.collection('clients').doc(String(doc.clientId)).get();
            if (clientSnap.exists) {
              const client = mapDoc<Client>(clientSnap);
              clientName = `${client.firstName} ${client.lastName}`;
            }
          }

          const docType = doc.type === "quote" ? "Devis" : "Facture";

          try {
            await sendEmail({
              to: process.env.SMTP_USER || "coachdigitalparis@gmail.com",
              subject: `${docType} ${doc.number} ouvert par ${clientName}`,
              html: `
                      <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2 style="color: #E67E50;">Document ouvert</h2>
                        <p><strong>${clientName}</strong> vient d'ouvrir le ${docType.toLowerCase()} <strong>${doc.number}</strong>.</p>
                        <p><strong>Date:</strong> ${now.toLocaleString("fr-FR")}</p>
                        <p><strong>Montant:</strong> ${doc.totalTtc} €</p>
                        <p style="margin-top: 20px;">
                          <a href="${process.env.VITE_APP_URL || "https://coachdigital.biz"}/documents" 
                             style="background-color: #E67E50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                            Voir le document
                          </a>
                        </p>
                      </div>
                    `,
              text: `${clientName} vient d'ouvrir le ${docType.toLowerCase()} ${doc.number}.`,
            });
          } catch (e) {
            console.error("Erreur envoi notification ouverture:", e);
          }
        }
      }

      return { success: true, documentId: tracking.documentId };
    }),

  getDocumentByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const trackSnap = await firestore.collection('documentTracking')
        .where('trackingToken', '==', input.token)
        .limit(1)
        .get();

      if (trackSnap.empty) return null;
      const tracking = mapDoc<DocumentTracking>(trackSnap.docs[0]);

      const docSnap = await firestore.collection('documents').doc(String(tracking.documentId)).get();
      if (!docSnap.exists) return null;
      const doc = mapDoc<ClientDocument>(docSnap);

      let client: Client | null = null;
      if (doc.clientId) {
        const clientSnap = await firestore.collection('clients').doc(String(doc.clientId)).get();
        if (clientSnap.exists) client = mapDoc<Client>(clientSnap);
      }

      return {
        document: doc,
        client,
        tracking,
      };
    }),

  getRecentViews: protectedProcedure.query(async () => {
    // Join simulation: fetch recent views, then fetch related data
    const viewsSnap = await firestore.collection('documentViews')
      .orderBy('viewedAt', 'desc')
      .limit(20)
      .get();

    const views = viewsSnap.docs.map(doc => mapDoc<DocumentView>(doc));

    const results = [];
    for (const view of views) {
      // Fetch tracking? View has trackingId but documentId too? Schema says yes.
      // Assuming view has documentId.
      const docSnap = await firestore.collection('documents').doc(String(view.documentId)).get();
      if (docSnap.exists) {
        const doc = mapDoc<ClientDocument>(docSnap);
        let client: Client | null = null;
        if (doc.clientId) {
          const clientSnap = await firestore.collection('clients').doc(String(doc.clientId)).get();
          if (clientSnap.exists) client = mapDoc<Client>(clientSnap);
        }

        results.push({
          ...view,
          document: doc,
          client
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
      const signatureToken = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      const id = await getNextId('documentSignatures');
      await firestore.collection('documentSignatures').doc(String(id)).set({
        id,
        documentId: input.documentId,
        signatureToken,
        signerName: input.signerName,
        signerEmail: input.signerEmail,
        signerRole: input.signerRole,
        expiresAt,
        status: "pending",
        reminderCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const signatureUrl = `${process.env.VITE_APP_URL || "https://coachdigital.biz"}/sign/${signatureToken}`;

      return {
        signatureId: id,
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
      const docSnap = await firestore.collection('documents').doc(String(input.documentId)).get();
      if (!docSnap.exists) throw new Error("Document introuvable");
      const doc = mapDoc<ClientDocument>(docSnap);

      const signatureToken = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const id = await getNextId('documentSignatures');
      await firestore.collection('documentSignatures').doc(String(id)).set({
        id,
        documentId: input.documentId,
        signatureToken,
        signerName: input.signerName,
        signerEmail: input.signerEmail,
        signerRole: "client",
        expiresAt,
        status: "pending",
        reminderCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const signatureUrl = `${process.env.VITE_APP_URL || "https://coachdigital.biz"}/sign/${signatureToken}`;
      const docType = doc.type === "quote" ? "devis" : "facture";

      await sendEmail({
        to: input.signerEmail,
        subject: `Signature requise - ${docType.charAt(0).toUpperCase() + docType.slice(1)} ${doc.number}`,
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
              <p><strong>Document:</strong> ${docType.charAt(0).toUpperCase() + docType.slice(1)} ${doc.number}</p>
              <p><strong>Montant:</strong> ${doc.totalTtc} € TTC</p>
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
      const snapshot = await firestore.collection('documentSignatures')
        .where('documentId', '==', input.documentId)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map(doc => mapDoc<DocumentSignature>(doc));
    }),

  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const snap = await firestore.collection('documentSignatures')
        .where('signatureToken', '==', input.token)
        .limit(1)
        .get();

      if (snap.empty) return null;
      const signature = mapDoc<DocumentSignature>(snap.docs[0]);

      const docSnap = await firestore.collection('documents').doc(String(signature.documentId)).get();
      const doc = docSnap.exists ? mapDoc<ClientDocument>(docSnap) : null;

      let client = null;
      if (doc && doc.clientId) {
        const clientSnap = await firestore.collection('clients').doc(String(doc.clientId)).get();
        if (clientSnap.exists) client = mapDoc<Client>(clientSnap);
      }

      return {
        signature,
        document: doc,
        client,
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
      const snap = await firestore.collection('documentSignatures')
        .where('signatureToken', '==', input.token)
        .limit(1)
        .get();

      if (snap.empty) throw new Error("Token invalide");
      const sigDoc = snap.docs[0];
      const signature = mapDoc<DocumentSignature>(sigDoc);

      if (signature.status === "signed") throw new Error("Document déjà signé");
      if (signature.expiresAt && new Date(signature.expiresAt) < new Date()) {
        throw new Error("Le lien de signature a expiré");
      }

      const now = new Date();

      await sigDoc.ref.update({
        status: "signed",
        signatureData: input.signatureData,
        signedAt: now,
        signedIp: input.ipAddress || null,
        signedUserAgent: input.userAgent || null,
        updatedAt: now
      });

      const docRef = firestore.collection('documents').doc(String(signature.documentId));
      const docSnap = await docRef.get();
      const doc = docSnap.exists ? mapDoc<ClientDocument>(docSnap) : null;

      if (doc && doc.type === "quote") {
        await docRef.update({ status: "accepted" });
      }

      if (doc) {
        const docType = doc.type === "quote" ? "Devis" : "Facture";
        try {
          await sendEmail({
            to: process.env.SMTP_USER || "coachdigitalparis@gmail.com",
            subject: `${docType} ${doc.number} signé par ${signature.signerName}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #22c55e;">Document signé</h2>
                <p><strong>${signature.signerName}</strong> a signé le ${docType.toLowerCase()} <strong>${doc.number}</strong>.</p>
                <p><strong>Date:</strong> ${now.toLocaleString("fr-FR")}</p>
                <p><strong>Email:</strong> ${signature.signerEmail}</p>
                <p><strong>Montant:</strong> ${doc.totalTtc} €</p>
                <p style="margin-top: 20px;">
                  <a href="${process.env.VITE_APP_URL || "https://coachdigital.biz"}/documents" 
                     style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                    Voir le document
                  </a>
                </p>
              </div>
            `,
            text: `${signature.signerName} a signé le ${docType.toLowerCase()} ${doc.number}.`,
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
      const snap = await firestore.collection('documentSignatures')
        .where('signatureToken', '==', input.token)
        .limit(1)
        .get();

      if (snap.empty) throw new Error("Token invalide");
      const sigDoc = snap.docs[0];
      const signature = mapDoc<DocumentSignature>(sigDoc);

      if (signature.status !== "pending") throw new Error("Action non autorisée");

      await sigDoc.ref.update({
        status: "declined",
        declinedReason: input.reason || null,
        updatedAt: new Date()
      });

      const docRef = firestore.collection('documents').doc(String(signature.documentId));
      const docSnap = await docRef.get();
      const doc = docSnap.exists ? mapDoc<ClientDocument>(docSnap) : null;

      if (doc && doc.type === "quote") {
        await docRef.update({ status: "rejected" });
      }

      if (doc) {
        const docType = doc.type === "quote" ? "Devis" : "Facture";
        try {
          await sendEmail({
            to: process.env.SMTP_USER || "coachdigitalparis@gmail.com",
            subject: `${docType} ${doc.number} refusé par ${signature.signerName}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #ef4444;">Document refusé</h2>
                <p><strong>${signature.signerName}</strong> a refusé le ${docType.toLowerCase()} <strong>${doc.number}</strong>.</p>
                ${input.reason ? `<p><strong>Raison:</strong> ${input.reason}</p>` : ""}
                <p style="margin-top: 20px;">
                  <a href="${process.env.VITE_APP_URL || "https://coachdigital.biz"}/documents" 
                     style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                    Voir le document
                  </a>
                </p>
              </div>
            `,
            text: `${signature.signerName} a refusé le ${docType.toLowerCase()} ${doc.number}. ${input.reason ? `Raison: ${input.reason}` : ""}`,
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
      const sigRef = firestore.collection('documentSignatures').doc(String(input.signatureId));
      const sigSnap = await sigRef.get();

      if (!sigSnap.exists) throw new Error("Signature introuvable");
      const signature = mapDoc<DocumentSignature>(sigSnap);
      if (signature.status !== "pending") throw new Error("Document déjà traité");

      const docRef = firestore.collection('documents').doc(String(signature.documentId));
      const docSnap = await docRef.get();
      if (!docSnap.exists) throw new Error("Document introuvable");
      const doc = mapDoc<ClientDocument>(docSnap);

      const signatureUrl = `${process.env.VITE_APP_URL || "https://coachdigital.biz"}/sign/${signature.signatureToken}`;
      const docType = doc.type === "quote" ? "devis" : "facture";

      await sendEmail({
        to: signature.signerEmail,
        subject: `Rappel: Signature requise - ${docType.charAt(0).toUpperCase() + docType.slice(1)} ${doc.number}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #E67E50;">Rappel de signature</h2>
            <p>Bonjour ${signature.signerName},</p>
            <p>Nous vous rappelons qu'un ${docType} est en attente de votre signature.</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Document:</strong> ${doc.number}</p>
              <p><strong>Montant:</strong> ${doc.totalTtc} € TTC</p>
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

      await sigRef.update({
        reminderSentAt: new Date(),
        reminderCount: (signature.reminderCount || 0) + 1
      });

      return { success: true };
    }),

  getPendingSignatures: protectedProcedure.query(async () => {
    const snap = await firestore.collection('documentSignatures')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const pending = snap.docs.map(doc => mapDoc<DocumentSignature>(doc));

    const results = [];
    for (const sig of pending) {
      const docSnap = await firestore.collection('documents').doc(String(sig.documentId)).get();
      if (docSnap.exists) {
        const doc = mapDoc<ClientDocument>(docSnap);
        let client = null;
        if (doc.clientId) {
          const clientSnap = await firestore.collection('clients').doc(String(doc.clientId)).get();
          if (clientSnap.exists) client = mapDoc<Client>(clientSnap);
        }
        results.push({
          ...sig,
          document: doc,
          client
        });
      }
    }

    return results;
  }),
});
