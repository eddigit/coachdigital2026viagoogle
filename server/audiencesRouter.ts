import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getNextId } from "./db";
import { db as firestore } from "./firestore";
import { Audience, Lead } from "./schema";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

export const audiencesRouter = router({
  // Liste toutes les audiences
  list: protectedProcedure.query(async () => {
    const snapshot = await firestore.collection('audiences')
      .where('isActive', '==', true)
      .orderBy('name')
      .get();
    return snapshot.docs.map(doc => mapDoc<Audience>(doc));
  }),

  // Récupère une audience par ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const doc = await firestore.collection('audiences').doc(String(input.id)).get();
      if (!doc.exists) return null;
      return mapDoc<Audience>(doc);
    }),

  // Crée une nouvelle audience
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366F1"),
      icon: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await getNextId('audiences');
      await firestore.collection('audiences').doc(String(id)).set({
        ...input,
        id,
        isActive: true, // Default
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { id, ...input };
    }),

  // Met à jour une audience
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      icon: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await firestore.collection('audiences').doc(String(id)).update({
        ...data,
        updatedAt: new Date()
      });
      return { success: true };
    }),

  // Supprime une audience (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      // Logic to move leads to "Général"
      const doc = await firestore.collection('audiences').doc(String(input.id)).get();
      if (doc.exists) {
        const audience = mapDoc<Audience>(doc);

        // Find 'Général' audience only if it exists? Drizzle query assumed it.
        // We'll update matching leads.
        const leadsSnapshot = await firestore.collection('leads')
          .where('audience', '==', audience.name)
          .get();

        if (!leadsSnapshot.empty) {
          const batch = firestore.batch();
          leadsSnapshot.docs.forEach(d => {
            batch.update(d.ref, { audience: "Général" });
          });
          await batch.commit();
        }
      }

      await firestore.collection('audiences').doc(String(input.id)).update({ isActive: false });
      return { success: true };
    }),

  // Statistiques par audience
  getStats: protectedProcedure.query(async () => {
    const audiencesSnapshot = await firestore.collection('audiences')
      .where('isActive', '==', true)
      .get();
    const audiencesList = audiencesSnapshot.docs.map(doc => mapDoc<Audience>(doc));

    const stats = await Promise.all(
      audiencesList.map(async (audience) => {
        // Count queries for efficiency?
        // But need potentialAmount sum.
        const leadsSnapshot = await firestore.collection('leads')
          .where('audience', '==', audience.name)
          .get();

        const leads = leadsSnapshot.docs.map(d => mapDoc<Lead>(d));

        const count = leads.length;
        const totalPotential = leads.reduce((sum, l) => sum + Number(l.potentialAmount || 0), 0);
        const converted = leads.filter(l => l.convertedToClientId).length;

        return {
          ...audience,
          leadsCount: count,
          totalPotential,
          convertedCount: converted,
        };
      })
    );

    return stats;
  }),

  // Assigner une audience à plusieurs leads
  assignToLeads: protectedProcedure
    .input(z.object({
      audienceName: z.string(),
      leadIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const batch = firestore.batch();

      input.leadIds.forEach(id => {
        const ref = firestore.collection('leads').doc(String(id));
        batch.update(ref, { audience: input.audienceName });
      });

      await batch.commit();
      return { success: true, count: input.leadIds.length };
    }),

  // Changer la phase de plusieurs leads
  changePhaseForLeads: protectedProcedure
    .input(z.object({
      status: z.enum(["suspect", "prospect", "analyse", "negociation", "conclusion", "ordre"]),
      leadIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const batch = firestore.batch();

      input.leadIds.forEach(id => {
        const ref = firestore.collection('leads').doc(String(id));
        batch.update(ref, { status: input.status });
      });

      await batch.commit();
      return { success: true, count: input.leadIds.length };
    }),
});
