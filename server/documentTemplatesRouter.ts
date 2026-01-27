import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getNextId } from "./db";
import { db as firestore } from "./firestore";
import { DocumentTemplate } from "./schema";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

export const documentTemplatesRouter = router({
  // Récupérer le template par défaut de l'utilisateur
  getDefault: protectedProcedure
    .input(z.object({ type: z.enum(["quote", "invoice"]) }))
    .query(async ({ input, ctx }) => {
      const snapshot = await firestore.collection('documentTemplates')
        .where('userId', '==', ctx.user.id)
        .where('type', '==', input.type)
        .where('isDefault', '==', true)
        .limit(1)
        .get();

      const templates = snapshot.docs.map(doc => mapDoc<DocumentTemplate>(doc));
      return templates[0] || null;
    }),

  // Récupérer tous les templates de l'utilisateur
  list: protectedProcedure
    .input(z.object({ type: z.enum(["quote", "invoice"]).optional() }))
    .query(async ({ input, ctx }) => {
      let q = firestore.collection('documentTemplates')
        .where('userId', '==', ctx.user.id);

      if (input.type) {
        q = q.where('type', '==', input.type);
      }

      const snapshot = await q.get();
      return snapshot.docs.map(doc => mapDoc<DocumentTemplate>(doc));
    }),

  // Récupérer un template par ID
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const doc = await firestore.collection('documentTemplates').doc(String(input.id)).get();
      if (!doc.exists) return null;
      const tmpl = mapDoc<DocumentTemplate>(doc);
      if (tmpl.userId !== ctx.user.id) return null;
      return tmpl;
    }),

  // Créer un nouveau template
  create: protectedProcedure
    .input(z.object({
      type: z.enum(["quote", "invoice"]),
      name: z.string().min(1),
      logoUrl: z.string().optional().nullable(),
      primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      companyName: z.string().optional().nullable(),
      companyAddress: z.string().optional().nullable(),
      companyPhone: z.string().optional().nullable(),
      companyEmail: z.string().email().optional().nullable(),
      companySiret: z.string().optional().nullable(),
      companyTva: z.string().optional().nullable(),
      legalMentions: z.string().optional().nullable(),
      termsAndConditions: z.string().optional().nullable(),
      footerText: z.string().optional().nullable(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await getNextId('documentTemplates');

      // Si isDefault est true, désactiver les autres templates par défaut du même type
      if (input.isDefault) {
        const snapshot = await firestore.collection('documentTemplates')
          .where('userId', '==', ctx.user.id)
          .where('type', '==', input.type)
          .get();

        const batch = firestore.batch();
        snapshot.docs.forEach(d => {
          if (d.data().isDefault) {
            batch.update(d.ref, { isDefault: false });
          }
        });
        await batch.commit();
      }

      await firestore.collection('documentTemplates').doc(String(id)).set({
        ...input,
        userId: ctx.user.id,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return { success: true, id };
    }),

  // Mettre à jour un template
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      logoUrl: z.string().optional().nullable(),
      primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      companyName: z.string().optional().nullable(),
      companyAddress: z.string().optional().nullable(),
      companyPhone: z.string().optional().nullable(),
      companyEmail: z.string().email().optional().nullable(),
      companySiret: z.string().optional().nullable(),
      companyTva: z.string().optional().nullable(),
      legalMentions: z.string().optional().nullable(),
      termsAndConditions: z.string().optional().nullable(),
      footerText: z.string().optional().nullable(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const ref = firestore.collection('documentTemplates').doc(String(id));
      const doc = await ref.get();
      if (!doc.exists) throw new Error("Template not found");
      const tmpl = mapDoc<DocumentTemplate>(doc);
      if (tmpl.userId !== ctx.user.id) throw new Error("Unauthorized");

      // Si isDefault est true, désactiver les autres templates par défaut du même type
      if (data.isDefault) {
        // Obtenir type actuel si non fourni ou si fourni
        const type = tmpl.type; // type shouldn't change generally, but input schema doesn't allow changing type, wait, input doesn't have type field.
        // Good.
        // Wait, what if input updates default but type is not in input? We use tmpl.type.

        const snapshot = await firestore.collection('documentTemplates')
          .where('userId', '==', ctx.user.id)
          .where('type', '==', type)
          .get();

        const batch = firestore.batch();
        snapshot.docs.forEach(d => {
          if (d.id !== String(id) && d.data().isDefault) {
            batch.update(d.ref, { isDefault: false });
          }
        });
        await batch.commit();
      }

      await ref.update({
        ...data,
        updatedAt: new Date()
      });

      return { success: true };
    }),

  // Supprimer un template
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const ref = firestore.collection('documentTemplates').doc(String(input.id));
      const doc = await ref.get();
      if (!doc.exists) return { success: true }; // already deleted
      if (doc.data()?.userId !== ctx.user.id) throw new Error("Unauthorized");

      await ref.delete();
      return { success: true };
    }),
});
