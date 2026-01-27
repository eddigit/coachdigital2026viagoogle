import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getNextId } from "./db";
import { db as firestore } from "./firestore";
import { ProjectNote } from "./schema";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

export const projectNotesRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const snapshot = await firestore.collection('projectNotes')
        .where('projectId', '==', input.projectId)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map(doc => mapDoc<ProjectNote>(doc));
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string(),
        content: z.string(),
        tags: z.string().optional(),
        isPinned: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const id = await getNextId('projectNotes');
      await firestore.collection('projectNotes').doc(String(id)).set({
        ...input,
        id,
        createdBy: ctx.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        tags: z.string().optional().nullable(),
        isPinned: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await firestore.collection('projectNotes').doc(String(id)).update({
        ...data,
        updatedAt: new Date()
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await firestore.collection('projectNotes').doc(String(input.id)).delete();
      return { success: true };
    }),
});
