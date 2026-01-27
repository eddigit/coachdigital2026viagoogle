import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getNextId } from "./db";
import { db as firestore } from "./firestore";
import { Review, Project } from "./schema";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

export const reviewsRouter = router({
  /**
   * Créer un nouvel avis (client uniquement)
   */
  create: publicProcedure
    .input(z.object({
      clientId: z.number(),
      projectId: z.number().optional(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
      isPublic: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const id = await getNextId('reviews');
      await firestore.collection('reviews').doc(String(id)).set({
        id,
        ...input,
        response: null,
        respondedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { success: true, id };
    }),

  /**
   * Récupérer tous les avis (avec filtres optionnels)
   */
  list: publicProcedure
    .input(z.object({
      clientId: z.number().optional(),
      projectId: z.number().optional(),
      isPublic: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      let q: FirebaseFirestore.Query = firestore.collection('reviews');

      if (input) {
        if (input.clientId) q = q.where('clientId', '==', input.clientId);
        if (input.projectId) q = q.where('projectId', '==', input.projectId);
        if (input.isPublic !== undefined) q = q.where('isPublic', '==', input.isPublic);
      }

      q = q.orderBy('createdAt', 'desc');
      const snapshot = await q.get();
      return snapshot.docs.map(doc => mapDoc<Review>(doc));
    }),

  /**
   * Récupérer un avis par ID
   */
  getById: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const doc = await firestore.collection('reviews').doc(String(input.id)).get();
      if (!doc.exists) return null;
      return mapDoc<Review>(doc);
    }),

  /**
   * Mettre à jour un avis (client uniquement)
   */
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      rating: z.number().min(1).max(5).optional(),
      comment: z.string().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await firestore.collection('reviews').doc(String(id)).update({
        ...data,
        updatedAt: new Date()
      });
      return { success: true };
    }),

  /**
   * Supprimer un avis (coach uniquement)
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      await firestore.collection('reviews').doc(String(input.id)).delete();
      return { success: true };
    }),

  /**
   * Répondre à un avis (coach uniquement)
   */
  respond: protectedProcedure
    .input(z.object({
      id: z.number(),
      response: z.string(),
    }))
    .mutation(async ({ input }) => {
      await firestore.collection('reviews').doc(String(input.id)).update({
        response: input.response,
        respondedAt: new Date(),
        updatedAt: new Date()
      });
      return { success: true };
    }),

  /**
   * Récupérer la note moyenne
   */
  getAverageRating: publicProcedure
    .query(async () => {
      const snapshot = await firestore.collection('reviews').get();
      if (snapshot.empty) return { average: 0 };

      const ratings = snapshot.docs.map(doc => doc.data().rating as number);
      const sum = ratings.reduce((a, b) => a + b, 0);
      return { average: Number((sum / ratings.length).toFixed(1)) };
    }),

  /**
   * Récupérer les avis d'un client avec les projets associés
   */
  getClientReviewsWithProjects: publicProcedure
    .input(z.object({
      clientId: z.number(),
    }))
    .query(async ({ input }) => {
      const reviewsSnap = await firestore.collection('reviews')
        .where('clientId', '==', input.clientId)
        .orderBy('createdAt', 'desc')
        .get();

      const reviews = reviewsSnap.docs.map(doc => mapDoc<Review>(doc));

      const results = [];
      for (const review of reviews) {
        let project = null;
        if (review.projectId) {
          const projSnap = await firestore.collection('projects').doc(String(review.projectId)).get();
          if (projSnap.exists) {
            project = mapDoc<Project>(projSnap);
          }
        }
        results.push({ ...review, project });
      }

      return results;
    }),
});
