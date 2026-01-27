import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getNextId } from "./db";
import { db as firestore } from "./firestore";
import { Note } from "./schema";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

export const notesRouter = router({
  // Lister toutes les notes
  list: protectedProcedure.query(async () => {
    const snapshot = await firestore.collection('notes')
      .orderBy('pinned', 'desc')
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => mapDoc<Note>(doc));
  }),

  // Lister les notes par client
  listByClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      const snapshot = await firestore.collection('notes')
        .where('clientId', '==', input.clientId)
        .orderBy('pinned', 'desc')
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map(doc => mapDoc<Note>(doc));
    }),

  // Lister les notes par projet
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const snapshot = await firestore.collection('notes')
        .where('projectId', '==', input.projectId)
        .orderBy('pinned', 'desc')
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map(doc => mapDoc<Note>(doc));
    }),

  // Créer une note
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string(),
        clientId: z.number().optional(),
        projectId: z.number().optional(),
        taskId: z.number().optional(),
        color: z.enum(["yellow", "blue", "green", "red", "purple", "orange"]).default("yellow"),
        pinned: z.boolean().default(false),
        isClientVisible: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const id = await getNextId('notes');
      await firestore.collection('notes').doc(String(id)).set({
        ...input,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { success: true, id };
    }),

  // Mettre à jour une note
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().optional(),
        clientId: z.number().optional(),
        projectId: z.number().optional(),
        taskId: z.number().optional(),
        color: z.enum(["yellow", "blue", "green", "red", "purple", "orange"]).optional(),
        pinned: z.boolean().optional(),
        isClientVisible: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      await firestore.collection('notes').doc(String(id)).update({
        ...updateData,
        updatedAt: new Date()
      });
      return { success: true };
    }),

  // Supprimer une note
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await firestore.collection('notes').doc(String(input.id)).delete();
      return { success: true };
    }),

  // Épingler/désépingler une note
  togglePin: protectedProcedure
    .input(z.object({ id: z.number(), pinned: z.boolean() }))
    .mutation(async ({ input }) => {
      await firestore.collection('notes').doc(String(input.id)).update({
        pinned: input.pinned,
        updatedAt: new Date()
      });
      return { success: true };
    }),
});
